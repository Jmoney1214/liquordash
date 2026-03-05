/**
 * Lightspeed Retail R-Series API Service
 *
 * Handles OAuth token management, product catalog sync, inventory tracking,
 * order management, and customer sync via the Lightspeed Retail API.
 *
 * OAuth Flow:
 *   1. Admin redirects to Lightspeed auth page
 *   2. Lightspeed redirects back with authorization code
 *   3. Server exchanges code for access_token + refresh_token
 *   4. Tokens stored in database for persistence
 *   5. Auto-refresh when access_token expires (1 hour)
 *
 * API Base: https://api.lightspeedapp.com/API/Account/{accountID}/
 */

// ─── Configuration ───────────────────────────────────────────────────────────

const LS_AUTH_URL = "https://cloud.lightspeedapp.com/oauth/authorize.php";
const LS_TOKEN_URL = "https://cloud.merchantos.com/oauth/access_token.php";
const LS_API_BASE = "https://api.lightspeedapp.com/API";

function getConfig() {
  const clientId = process.env.LIGHTSPEED_CLIENT_ID;
  const clientSecret = process.env.LIGHTSPEED_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing Lightspeed credentials. Set LIGHTSPEED_CLIENT_ID and LIGHTSPEED_CLIENT_SECRET."
    );
  }

  return { clientId, clientSecret };
}

// ─── Token Storage (in-memory + database persistence) ────────────────────────

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in ms
  accountId: string;
}

let cachedTokens: TokenData | null = null;

// Database helpers will be injected to avoid circular imports
let _saveTokens: ((data: TokenData) => Promise<void>) | null = null;
let _loadTokens: (() => Promise<TokenData | null>) | null = null;

export function setTokenPersistence(
  save: (data: TokenData) => Promise<void>,
  load: () => Promise<TokenData | null>
) {
  _saveTokens = save;
  _loadTokens = load;
}

async function persistTokens(data: TokenData): Promise<void> {
  cachedTokens = data;
  if (_saveTokens) {
    await _saveTokens(data);
  }
}

async function loadPersistedTokens(): Promise<TokenData | null> {
  if (cachedTokens) return cachedTokens;
  if (_loadTokens) {
    const data = await _loadTokens();
    if (data) cachedTokens = data;
    return data;
  }
  return null;
}

// ─── OAuth Flow ──────────────────────────────────────────────────────────────

/**
 * Generate the authorization URL to redirect the admin to Lightspeed login.
 */
export function getAuthorizationUrl(redirectUri: string): string {
  const { clientId } = getConfig();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "employee:all",
    redirect_uri: redirectUri,
  });
  return `${LS_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange an authorization code for access and refresh tokens.
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<TokenData> {
  const { clientId, clientSecret } = getConfig();

  const response = await fetch(LS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Lightspeed OAuth token exchange failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
    account_id?: string;
  };

  // Lightspeed returns account_id in the token response; fallback to API call
  const accountId = data.account_id ?? await fetchAccountId(data.access_token);

  const tokenData: TokenData = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000, // 5-min buffer
    accountId,
  };

  await persistTokens(tokenData);
  return tokenData;
}

/**
 * Refresh the access token using the refresh token.
 */
async function refreshAccessToken(): Promise<TokenData> {
  const tokens = await loadPersistedTokens();
  if (!tokens?.refreshToken) {
    throw new Error("No refresh token available. Please re-authorize with Lightspeed.");
  }

  const { clientId, clientSecret } = getConfig();

  const response = await fetch(LS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokens.refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    // If refresh fails, clear tokens so admin knows to re-authorize
    cachedTokens = null;
    throw new Error(`Lightspeed token refresh failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  const tokenData: TokenData = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
    accountId: tokens.accountId,
  };

  await persistTokens(tokenData);
  return tokenData;
}

/**
 * Get a valid access token, refreshing if needed.
 */
async function getAccessToken(): Promise<{ token: string; accountId: string }> {
  let tokens = await loadPersistedTokens();

  if (!tokens) {
    throw new Error("Lightspeed not connected. Please authorize via admin settings.");
  }

  // Refresh if expired or about to expire
  if (Date.now() >= tokens.expiresAt) {
    tokens = await refreshAccessToken();
  }

  return { token: tokens.accessToken, accountId: tokens.accountId };
}

// ─── API Helper ──────────────────────────────────────────────────────────────

async function fetchAccountId(accessToken: string): Promise<string> {
  const response = await fetch(`${LS_API_BASE}/Account.json`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch Lightspeed account (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    Account: { accountID: string };
  };

  return data.Account.accountID;
}

interface FetchOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
}

async function lsFetch<T>(
  path: string,
  options: FetchOptions = {},
  retried = false
): Promise<T> {
  const { token, accountId } = await getAccessToken();

  let url = `${LS_API_BASE}/Account/${accountId}/${path}`;

  if (options.params) {
    const searchParams = new URLSearchParams(options.params);
    url += (url.includes("?") ? "&" : "?") + searchParams.toString();
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // Handle rate limiting (429)
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get("Retry-After") ?? "2", 10);
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return lsFetch<T>(path, options, retried);
  }

  // Handle token expiry (401) — refresh and retry once
  if (response.status === 401 && !retried) {
    await refreshAccessToken();
    return lsFetch<T>(path, options, true);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Lightspeed API error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<T>;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LsItem {
  itemID: string;
  systemSku: string;
  defaultCost: string;
  avgCost: string;
  discountable: string;
  tax: string;
  archived: string;
  itemType: string;
  description: string;
  modelYear: string;
  upc: string;
  ean: string;
  customSku: string;
  manufacturerSku: string;
  createTime: string;
  timeStamp: string;
  categoryID: string;
  taxClassID: string;
  departmentID: string;
  itemMatrixID: string;
  manufacturerID: string;
  seasonID: string;
  defaultVendorID: string;
  Prices?: {
    ItemPrice?: Array<{
      amount: string;
      useTypeID: string;
      useType: string;
    }>;
  };
  Images?: {
    Image?: {
      baseImageURL: string;
      publicID: string;
    };
  };
  ItemShops?: {
    ItemShop?: Array<{
      shopID: string;
      qoh: string; // quantity on hand
      sellable: string;
      reorderPoint: string;
      reorderLevel: string;
    }>;
  };
  Category?: {
    categoryID: string;
    name: string;
  };
  Manufacturer?: {
    manufacturerID: string;
    name: string;
  };
  Tags?: {
    tag: string | string[];
  };
  CustomFieldValues?: {
    CustomFieldValue?: Array<{
      customFieldValueID: string;
      customFieldID: string;
      name: string;
      value: string;
    }>;
  };
}

export interface LsCategory {
  categoryID: string;
  name: string;
  nodeDepth: string;
  fullPathName: string;
  leftNode: string;
  rightNode: string;
  createTime: string;
  timeStamp: string;
  parentID?: string;
}

export interface LsCustomer {
  customerID: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  createTime: string;
  timeStamp: string;
  archived: string;
  contactID: string;
  creditAccountID: string;
  customerTypeID: string;
  Contact?: {
    contactID: string;
    custom: string;
    noEmail: string;
    noPhone: string;
    noMail: string;
    Emails?: {
      ContactEmail?: Array<{
        address: string;
        useType: string;
      }>;
    };
    Phones?: {
      ContactPhone?: Array<{
        number: string;
        useType: string;
      }>;
    };
    Addresses?: {
      ContactAddress?: Array<{
        address1: string;
        address2: string;
        city: string;
        state: string;
        zip: string;
        country: string;
      }>;
    };
  };
}

export interface LsSale {
  saleID: string;
  timeStamp: string;
  completed: string;
  archived: string;
  voided: string;
  enablePromotions: string;
  isTaxInclusive: string;
  createTime: string;
  updateTime: string;
  completeTime: string;
  shipToID: string;
  employeeID: string;
  shopID: string;
  customerID: string;
  registerID: string;
  shipTo?: {
    firstName: string;
    lastName: string;
    company: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  SaleLines?: {
    SaleLine?: Array<{
      saleLineID: string;
      createTime: string;
      timeStamp: string;
      unitQuantity: string;
      unitPrice: string;
      normalUnitPrice: string;
      discountAmount: string;
      discountPercent: string;
      avgCost: string;
      tax: string;
      taxTotal: string;
      calcTotal: string;
      calcSubtotal: string;
      calcTax1: string;
      calcTax2: string;
      calcDiscount: string;
      itemID: string;
      isLayaway: string;
      isWorkorder: string;
      isSpecialOrder: string;
      Item?: {
        itemID: string;
        description: string;
        customSku: string;
        systemSku: string;
      };
    }>;
  };
  SalePayments?: {
    SalePayment?: Array<{
      salePaymentID: string;
      amount: string;
      paymentTypeID: string;
      PaymentType?: {
        name: string;
      };
    }>;
  };
  calcTotal: string;
  calcSubtotal: string;
  calcTaxable: string;
  calcNonTaxable: string;
  calcAvgCost: string;
  calcFIFOCost: string;
  calcTax1: string;
  calcTax2: string;
  calcPayments: string;
  total: string;
  totalDue: string;
  displayableSubtotal: string;
  ticketNumber: string;
}

export interface LsShop {
  shopID: string;
  name: string;
  serviceBody: string;
  contact: {
    firstName: string;
    lastName: string;
    Addresses?: {
      ContactAddress?: Array<{
        address1: string;
        city: string;
        state: string;
        zip: string;
      }>;
    };
    Phones?: {
      ContactPhone?: Array<{
        number: string;
      }>;
    };
  };
  timeZone: string;
}

// ─── Account ─────────────────────────────────────────────────────────────────

export async function getAccount(): Promise<{
  accountID: string;
  name: string;
  link: string;
}> {
  const { token } = await getAccessToken();
  const response = await fetch(`${LS_API_BASE}/Account.json`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch account (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as { Account: any };
  return {
    accountID: data.Account.accountID,
    name: data.Account.name,
    link: data.Account.link?.["%40attributes"]?.href ?? "",
  };
}

// ─── Shops (Locations) ──────────────────────────────────────────────────────

export async function getShops(): Promise<LsShop[]> {
  const data = await lsFetch<{ Shop?: LsShop | LsShop[] }>("Shop.json");
  if (!data.Shop) return [];
  return Array.isArray(data.Shop) ? data.Shop : [data.Shop];
}

// ─── Products (Items) ────────────────────────────────────────────────────────

export async function getItems(params?: {
  limit?: number;
  offset?: number;
  categoryID?: string;
  archived?: boolean;
  orderby?: string;
}): Promise<{ items: LsItem[]; count: number }> {
  const queryParams: Record<string, string> = {};

  if (params?.limit) queryParams.limit = String(params.limit);
  if (params?.offset) queryParams.offset = String(params.offset);
  if (params?.categoryID) queryParams.categoryID = params.categoryID;
  if (params?.archived !== undefined) queryParams.archived = params.archived ? "true" : "false";
  if (params?.orderby) queryParams.orderby = params.orderby;

  // Load relations for prices, images, category, manufacturer
  queryParams.load_relations = JSON.stringify([
    "Prices",
    "Images",
    "ItemShops",
    "Category",
    "Manufacturer",
    "Tags",
    "CustomFieldValues",
  ]);

  const data = await lsFetch<{
    Item?: LsItem | LsItem[];
    "@attributes"?: { count: string };
  }>("Item.json", { params: queryParams });

  const items = !data.Item ? [] : Array.isArray(data.Item) ? data.Item : [data.Item];
  const count = parseInt(data["@attributes"]?.count ?? String(items.length), 10);

  return { items, count };
}

export async function getItemById(itemId: string): Promise<LsItem | null> {
  try {
    const data = await lsFetch<{ Item: LsItem }>(`Item/${itemId}.json`, {
      params: {
        load_relations: JSON.stringify([
          "Prices",
          "Images",
          "ItemShops",
          "Category",
          "Manufacturer",
          "Tags",
          "CustomFieldValues",
        ]),
      },
    });
    return data.Item ?? null;
  } catch {
    return null;
  }
}

export async function searchItems(query: string, limit = 50): Promise<LsItem[]> {
  const data = await lsFetch<{ Item?: LsItem | LsItem[] }>("Item.json", {
    params: {
      description: `~,${query}`,
      limit: String(limit),
      load_relations: JSON.stringify(["Prices", "Images", "Category"]),
    },
  });

  if (!data.Item) return [];
  return Array.isArray(data.Item) ? data.Item : [data.Item];
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function getCategories(): Promise<LsCategory[]> {
  const data = await lsFetch<{ Category?: LsCategory | LsCategory[] }>("Category.json");
  if (!data.Category) return [];
  return Array.isArray(data.Category) ? data.Category : [data.Category];
}

// ─── Inventory ───────────────────────────────────────────────────────────────

export async function getInventoryForItem(
  itemId: string
): Promise<Array<{ shopId: string; qoh: number; sellable: number }>> {
  const item = await getItemById(itemId);
  if (!item?.ItemShops?.ItemShop) return [];

  const shops = Array.isArray(item.ItemShops.ItemShop)
    ? item.ItemShops.ItemShop
    : [item.ItemShops.ItemShop];

  return shops.map((shop) => ({
    shopId: shop.shopID,
    qoh: parseInt(shop.qoh, 10) || 0,
    sellable: parseInt(shop.sellable, 10) || 0,
  }));
}

export async function getLowStockItems(
  threshold = 5,
  shopId?: string
): Promise<LsItem[]> {
  // Get all items with inventory data
  const { items } = await getItems({ limit: 250 });

  return items.filter((item) => {
    if (!item.ItemShops?.ItemShop) return false;
    const shops = Array.isArray(item.ItemShops.ItemShop)
      ? item.ItemShops.ItemShop
      : [item.ItemShops.ItemShop];

    const relevantShops = shopId
      ? shops.filter((s) => s.shopID === shopId)
      : shops;

    return relevantShops.some(
      (s) => parseInt(s.qoh, 10) <= threshold && parseInt(s.qoh, 10) >= 0
    );
  });
}

// ─── Customers ───────────────────────────────────────────────────────────────

export async function getCustomers(params?: {
  limit?: number;
  offset?: number;
  archived?: boolean;
}): Promise<{ customers: LsCustomer[]; count: number }> {
  const queryParams: Record<string, string> = {};

  if (params?.limit) queryParams.limit = String(params.limit);
  if (params?.offset) queryParams.offset = String(params.offset);
  if (params?.archived !== undefined) queryParams.archived = params.archived ? "true" : "false";

  queryParams.load_relations = JSON.stringify(["Contact"]);

  const data = await lsFetch<{
    Customer?: LsCustomer | LsCustomer[];
    "@attributes"?: { count: string };
  }>("Customer.json", { params: queryParams });

  const customers = !data.Customer
    ? []
    : Array.isArray(data.Customer)
      ? data.Customer
      : [data.Customer];
  const count = parseInt(data["@attributes"]?.count ?? String(customers.length), 10);

  return { customers, count };
}

export async function getCustomerById(customerId: string): Promise<LsCustomer | null> {
  try {
    const data = await lsFetch<{ Customer: LsCustomer }>(
      `Customer/${customerId}.json`,
      { params: { load_relations: JSON.stringify(["Contact"]) } }
    );
    return data.Customer ?? null;
  } catch {
    return null;
  }
}

export async function createCustomer(customer: {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: {
    address1: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };
}): Promise<LsCustomer> {
  const body: any = {
    firstName: customer.firstName,
    lastName: customer.lastName,
  };

  if (customer.email || customer.phone || customer.address) {
    body.Contact = {};
    if (customer.email) {
      body.Contact.Emails = {
        ContactEmail: { address: customer.email, useType: "Primary" },
      };
    }
    if (customer.phone) {
      body.Contact.Phones = {
        ContactPhone: { number: customer.phone, useType: "Home" },
      };
    }
    if (customer.address) {
      body.Contact.Addresses = {
        ContactAddress: {
          address1: customer.address.address1,
          city: customer.address.city,
          state: customer.address.state,
          zip: customer.address.zip,
          country: customer.address.country ?? "US",
        },
      };
    }
  }

  const data = await lsFetch<{ Customer: LsCustomer }>("Customer.json", {
    method: "POST",
    body,
  });

  return data.Customer;
}

// ─── Sales (Orders) ──────────────────────────────────────────────────────────

export async function getSales(params?: {
  limit?: number;
  offset?: number;
  completed?: boolean;
  voided?: boolean;
  startDate?: string; // ISO date
  endDate?: string;
}): Promise<{ sales: LsSale[]; count: number }> {
  const queryParams: Record<string, string> = {};

  if (params?.limit) queryParams.limit = String(params.limit);
  if (params?.offset) queryParams.offset = String(params.offset);
  if (params?.completed !== undefined) queryParams.completed = params.completed ? "true" : "false";
  if (params?.voided !== undefined) queryParams.voided = params.voided ? "true" : "false";
  if (params?.startDate) queryParams["completeTime"] = `>=,${params.startDate}`;
  if (params?.endDate) queryParams["completeTime"] = `<=,${params.endDate}`;

  queryParams.load_relations = JSON.stringify(["SaleLines", "SalePayments"]);
  queryParams.orderby = "completeTime";
  queryParams.orderby_desc = "1";

  const data = await lsFetch<{
    Sale?: LsSale | LsSale[];
    "@attributes"?: { count: string };
  }>("Sale.json", { params: queryParams });

  const sales = !data.Sale ? [] : Array.isArray(data.Sale) ? data.Sale : [data.Sale];
  const count = parseInt(data["@attributes"]?.count ?? String(sales.length), 10);

  return { sales, count };
}

export async function getSaleById(saleId: string): Promise<LsSale | null> {
  try {
    const data = await lsFetch<{ Sale: LsSale }>(`Sale/${saleId}.json`, {
      params: {
        load_relations: JSON.stringify(["SaleLines", "SalePayments", "SaleLines.Item"]),
      },
    });
    return data.Sale ?? null;
  } catch {
    return null;
  }
}

export async function createSale(sale: {
  employeeID?: string;
  shopID?: string;
  customerID?: string;
  lines: Array<{
    itemID: string;
    unitQuantity: number;
    unitPrice?: string;
  }>;
}): Promise<LsSale> {
  const body: any = {};

  if (sale.employeeID) body.employeeID = sale.employeeID;
  if (sale.shopID) body.shopID = sale.shopID;
  if (sale.customerID) body.customerID = sale.customerID;

  body.SaleLines = {
    SaleLine: sale.lines.map((line) => ({
      itemID: line.itemID,
      unitQuantity: String(line.unitQuantity),
      ...(line.unitPrice ? { unitPrice: line.unitPrice } : {}),
    })),
  };

  const data = await lsFetch<{ Sale: LsSale }>("Sale.json", {
    method: "POST",
    body,
  });

  return data.Sale;
}

// ─── Connection Status ───────────────────────────────────────────────────────

export async function isConnected(): Promise<boolean> {
  const tokens = await loadPersistedTokens();
  return !!tokens?.accessToken;
}

export async function getConnectionStatus(): Promise<{
  connected: boolean;
  accountId?: string;
  accountName?: string;
  error?: string;
}> {
  try {
    const tokens = await loadPersistedTokens();
    if (!tokens?.accessToken) {
      return { connected: false, error: "Not connected to Lightspeed" };
    }

    const account = await getAccount();
    return {
      connected: true,
      accountId: account.accountID,
      accountName: account.name,
    };
  } catch (err) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Disconnect from Lightspeed by clearing stored tokens.
 */
export function disconnect(): void {
  cachedTokens = null;
}

/**
 * Manually set tokens (e.g., from Postman OAuth flow).
 * This allows admins to paste tokens obtained externally.
 */
export async function setManualTokens(params: {
  accessToken: string;
  refreshToken: string;
  accountId: string;
}): Promise<void> {
  const tokenData: TokenData = {
    accessToken: params.accessToken,
    refreshToken: params.refreshToken,
    expiresAt: Date.now() + 25 * 60 * 1000, // Assume ~30 min validity, 5-min buffer
    accountId: params.accountId,
  };
  await persistTokens(tokenData);
}
