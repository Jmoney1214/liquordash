import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "magnifyingglass": "search",
  "cart.fill": "shopping-cart",
  "bag.fill": "shopping-bag",
  "person.fill": "person",
  "list.bullet": "receipt-long",
  "heart.fill": "favorite",
  "heart": "favorite-border",
  "star.fill": "star",
  "star": "star-border",
  "location.fill": "location-on",
  "clock.fill": "schedule",
  "shippingbox.fill": "local-shipping",
  "bolt.fill": "bolt",
  "gift.fill": "card-giftcard",
  "creditcard.fill": "credit-card",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "arrow.left": "arrow-back",
  "plus": "add",
  "minus": "remove",
  "trash.fill": "delete",
  "ellipsis": "more-horiz",
  "info.circle.fill": "info",
  "bell.fill": "notifications",
  "gearshape.fill": "settings",
  "questionmark.circle.fill": "help",
  "arrow.right": "arrow-forward",
  "mappin.and.ellipse": "place",
  "phone.fill": "phone",
  "envelope.fill": "email",
  "lock.fill": "lock",
  "person.badge.shield.checkmark.fill": "verified-user",
  "doc.text.fill": "description",
  "square.and.arrow.up.fill": "share",
  "storefront.fill": "storefront",
  "building.2.fill": "business",
  "clock.arrow.circlepath": "history",
  "chart.bar.fill": "bar-chart",
  "dollarsign.circle.fill": "attach-money",
  "tray.full.fill": "inventory",
  "checkmark.seal.fill": "verified",
  "exclamationmark.triangle.fill": "warning",
  "arrow.triangle.2.circlepath": "sync",
  "person.2.fill": "people",
  "hand.thumbsup.fill": "thumb-up",
  "hand.thumbsdown.fill": "thumb-down",
  "photo.fill": "photo",
  "pencil": "edit",
  "calendar": "event",
  "banknote.fill": "account-balance-wallet",
  "circle": "radio-button-unchecked",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
