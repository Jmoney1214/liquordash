import { Text, View, TouchableOpacity, ScrollView, FlatList, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCustomer, TIER_BENEFITS, TIER_COLORS, TIER_THRESHOLDS, RewardsTier, RewardsTransaction } from "@/lib/customer-store";

const TIER_ORDER: RewardsTier[] = ["bronze", "silver", "gold", "platinum"];

function TransactionRow({ tx }: { tx: RewardsTransaction }) {
  const colors = useColors();
  const isPositive = tx.type === "earned" || tx.type === "bonus";
  const date = new Date(tx.date);

  return (
    <View style={[styles.txRow, { borderColor: colors.border }]}>
      <View style={[styles.txIcon, { backgroundColor: isPositive ? colors.success + "15" : colors.error + "15" }]}>
        <IconSymbol
          name={isPositive ? "plus" : "minus"}
          size={14}
          color={isPositive ? colors.success : colors.error}
        />
      </View>
      <View style={styles.txInfo}>
        <Text style={[styles.txDesc, { color: colors.foreground }]}>{tx.description}</Text>
        <Text style={[styles.txDate, { color: colors.muted }]}>
          {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </Text>
      </View>
      <Text style={[styles.txPoints, { color: isPositive ? colors.success : colors.error }]}>
        {isPositive ? "+" : ""}{tx.points} pts
      </Text>
    </View>
  );
}

export default function RewardsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { rewards, redeemPoints } = useCustomer();

  const tierColor = TIER_COLORS[rewards.tier];
  const currentTierIdx = TIER_ORDER.indexOf(rewards.tier);
  const benefits = TIER_BENEFITS[rewards.tier];
  const pointsValue = (rewards.points / 100 * 5).toFixed(2); // 100 pts = $5

  const handleRedeem = () => {
    if (rewards.points < 100) {
      Alert.alert("Not Enough Points", "You need at least 100 points to redeem. Keep shopping to earn more!");
      return;
    }
    const redeemAmount = Math.floor(rewards.points / 100) * 100;
    const dollarValue = (redeemAmount / 100 * 5).toFixed(2);
    Alert.alert(
      "Redeem Points",
      `Redeem ${redeemAmount} points for $${dollarValue} off your next order?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Redeem", onPress: () => redeemPoints(redeemAmount, `Redeemed for $${dollarValue} credit`) },
      ]
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Rewards</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Points Card */}
        <View style={[styles.pointsCard, { backgroundColor: tierColor }]}>
          <View style={styles.pointsTop}>
            <View>
              <Text style={styles.tierLabel}>{rewards.tier.toUpperCase()} MEMBER</Text>
              <Text style={styles.pointsNumber}>{rewards.points.toLocaleString()}</Text>
              <Text style={styles.pointsLabel}>Available Points</Text>
            </View>
            <View style={styles.pointsValueWrap}>
              <Text style={styles.pointsValueLabel}>VALUE</Text>
              <Text style={styles.pointsValue}>${pointsValue}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          {rewards.tier !== "platinum" && (
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(rewards.tierProgress * 100, 100)}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {rewards.lifetimePoints.toLocaleString()} / {rewards.nextTierPoints.toLocaleString()} pts to {TIER_ORDER[currentTierIdx + 1]?.toUpperCase()}
              </Text>
            </View>
          )}

          <TouchableOpacity onPress={handleRedeem} style={styles.redeemBtn} activeOpacity={0.7}>
            <Text style={[styles.redeemBtnText, { color: tierColor }]}>Redeem Points</Text>
          </TouchableOpacity>
        </View>

        {/* How to Earn */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>How to Earn</Text>
          <View style={[styles.earnCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.earnRow}>
              <IconSymbol name="bag.fill" size={20} color={colors.primary} />
              <View style={styles.earnInfo}>
                <Text style={[styles.earnTitle, { color: colors.foreground }]}>Shop & Earn</Text>
                <Text style={[styles.earnDesc, { color: colors.muted }]}>
                  Earn {rewards.tier === "bronze" ? "1" : rewards.tier === "silver" ? "1.5" : rewards.tier === "gold" ? "2" : "3"} point{rewards.tier !== "bronze" ? "s" : ""} per $1 spent
                </Text>
              </View>
            </View>
            <View style={[styles.earnDivider, { backgroundColor: colors.border }]} />
            <View style={styles.earnRow}>
              <IconSymbol name="star.fill" size={20} color={colors.warning} />
              <View style={styles.earnInfo}>
                <Text style={[styles.earnTitle, { color: colors.foreground }]}>Write Reviews</Text>
                <Text style={[styles.earnDesc, { color: colors.muted }]}>Earn 25 points per product review</Text>
              </View>
            </View>
            <View style={[styles.earnDivider, { backgroundColor: colors.border }]} />
            <View style={styles.earnRow}>
              <IconSymbol name="person.2.fill" size={20} color={colors.success} />
              <View style={styles.earnInfo}>
                <Text style={[styles.earnTitle, { color: colors.foreground }]}>Refer Friends</Text>
                <Text style={[styles.earnDesc, { color: colors.muted }]}>Earn 200 points per referral</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tier Benefits */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Benefits</Text>
          <View style={[styles.benefitsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {benefits.map((benefit, idx) => (
              <View key={idx} style={styles.benefitRow}>
                <IconSymbol name="checkmark.circle.fill" size={18} color={tierColor} />
                <Text style={[styles.benefitText, { color: colors.foreground }]}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tier Roadmap */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tier Roadmap</Text>
          <View style={styles.tierRoadmap}>
            {TIER_ORDER.map((tier, idx) => {
              const isActive = idx <= currentTierIdx;
              const isCurrent = tier === rewards.tier;
              return (
                <View key={tier} style={styles.tierStep}>
                  <View style={[styles.tierDot, { backgroundColor: isActive ? TIER_COLORS[tier] : colors.border }]}>
                    {isCurrent && <IconSymbol name="checkmark.circle.fill" size={16} color="#fff" />}
                  </View>
                  <Text style={[styles.tierStepName, { color: isActive ? colors.foreground : colors.muted, fontWeight: isCurrent ? "700" : "500" }]}>
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </Text>
                  <Text style={[styles.tierStepPts, { color: colors.muted }]}>
                    {TIER_THRESHOLDS[tier].toLocaleString()} pts
                  </Text>
                  {idx < TIER_ORDER.length - 1 && (
                    <View style={[styles.tierLine, { backgroundColor: isActive ? TIER_COLORS[tier] : colors.border }]} />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Transaction History */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Points History</Text>
          {rewards.history.length === 0 ? (
            <Text style={[styles.noHistory, { color: colors.muted }]}>No transactions yet</Text>
          ) : (
            rewards.history.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  pointsCard: { marginHorizontal: 16, borderRadius: 20, padding: 20, marginBottom: 20 },
  pointsTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  tierLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  pointsNumber: { color: "#fff", fontSize: 40, fontWeight: "800", marginTop: 4 },
  pointsLabel: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "500" },
  pointsValueWrap: { alignItems: "flex-end" },
  pointsValueLabel: { color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: "600", letterSpacing: 0.5 },
  pointsValue: { color: "#fff", fontSize: 22, fontWeight: "700" },
  progressSection: { marginTop: 16 },
  progressBar: { height: 6, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#fff", borderRadius: 3 },
  progressText: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 6 },
  redeemBtn: { backgroundColor: "#fff", alignSelf: "center", paddingHorizontal: 28, paddingVertical: 10, borderRadius: 24, marginTop: 16 },
  redeemBtnText: { fontSize: 14, fontWeight: "700" },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  earnCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  earnRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  earnInfo: { flex: 1 },
  earnTitle: { fontSize: 14, fontWeight: "600" },
  earnDesc: { fontSize: 12, marginTop: 2 },
  earnDivider: { height: 0.5, marginLeft: 46 },
  benefitsCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  benefitText: { fontSize: 14, flex: 1 },
  tierRoadmap: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 8 },
  tierStep: { alignItems: "center", flex: 1, position: "relative" },
  tierDot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  tierStepName: { fontSize: 12 },
  tierStepPts: { fontSize: 10, marginTop: 2 },
  tierLine: { position: "absolute", top: 14, left: "60%", right: "-40%", height: 2 },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 0.5 },
  txIcon: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 14, fontWeight: "500" },
  txDate: { fontSize: 12, marginTop: 1 },
  txPoints: { fontSize: 14, fontWeight: "700" },
  noHistory: { fontSize: 14, textAlign: "center", paddingVertical: 20 },
});
