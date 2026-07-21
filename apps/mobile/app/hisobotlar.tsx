import { useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useReports } from '@/lib/hooks/useReports';
import { useMoney } from '@/lib/hooks/useMoney';
import { Loading, ErrorState } from '@/components/States';
import { formatMoney } from '@/lib/format';
import { exportHtmlToPdf, esc } from '@/lib/pdf';
import { colors } from '@/theme/tokens';
import type { ReportsSummary } from '@smeta/shared';

function buildHtml(r: ReportsSummary, t: TFunction): string {
  const row = (label: string, value: number) =>
    `<tr><td>${esc(label)}</td><td style="text-align:right">${esc(formatMoney(value, 'UZS'))}</td></tr>`;
  const planRows = r.planFakt
    .map(
      (p) =>
        `<tr><td>${esc(t(`reports.cat${p.category}`))}</td><td style="text-align:right">${esc(formatMoney(p.planned, 'UZS'))}</td><td style="text-align:right">${esc(formatMoney(p.fakt, 'UZS'))}</td><td style="text-align:right">${esc(formatMoney(p.diff, 'UZS'))}</td></tr>`,
    )
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:-apple-system,Roboto,sans-serif;color:#16181D;padding:24px}
    h1{color:#0F3473;font-size:22px;margin:0 0 4px}
    .sub{color:#666;font-size:12px;margin-bottom:16px}
    table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px}
    td,th{padding:8px 6px;border-bottom:1px solid #eee}
    th{color:#5555E7;text-align:left;font-size:11px;text-transform:uppercase}
  </style></head><body>
    <h1>Smeta AI — ${esc(t('reports.title'))}</h1>
    <div class="sub">${esc(t('reports.reportFor'))}: ${esc(r.period)}</div>
    <table>
      ${row(t('reports.totalExpense'), r.totalExpense)}
      ${row(t('reports.materialCost'), r.materialCost)}
      ${row(t('reports.laborCost'), r.laborCost)}
      ${row(t('reports.incoming'), r.incoming)}
      ${row(t('reports.netProfit'), r.netProfit)}
    </table>
    <table>
      <tr><th>${esc(t('reports.category'))}</th><th style="text-align:right">${esc(t('reports.planned'))}</th><th style="text-align:right">${esc(t('reports.fakt'))}</th><th style="text-align:right">${esc(t('reports.diff'))}</th></tr>
      ${planRows}
    </table>
  </body></html>`;
}

export default function ReportsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();
  const pid = typeof projectId === 'string' ? projectId : undefined;
  const money = useMoney();
  const { data, isLoading, isError, refetch, isRefetching } = useReports(pid ? { projectId: pid } : undefined);
  const [exporting, setExporting] = useState(false);

  async function onExport() {
    if (!data) return;
    setExporting(true);
    try {
      await exportHtmlToPdf(buildHtml(data, t), `smeta-hisobot-${data.period}`);
    } catch {
      /* bekor qilindi / xato — jim */
    } finally {
      setExporting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-ink" edges={['top']}>
      <View className="flex-row items-center gap-2 px-3 py-2 border-b border-border/40">
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full active:bg-white/5">
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </Pressable>
        <Text className="text-white text-base font-semibold flex-1">{t('reports.title')}</Text>
        {data ? (
          <Pressable onPress={onExport} disabled={exporting} className="flex-row items-center gap-1 px-3 h-9 rounded-lg bg-purple active:bg-purple-dark disabled:opacity-50">
            <Ionicons name="download-outline" size={16} color={colors.white} />
            <Text className="text-white text-xs font-semibold">{exporting ? t('reports.exporting') : t('reports.export')}</Text>
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <Loading />
      ) : isError || !data ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <ScrollView className="flex-1" contentContainerClassName="p-4 gap-4"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.purple} />}>
          <View className="flex-row flex-wrap gap-3">
            <Metric label={t('reports.totalExpense')} value={money.format(data.totalExpense)} />
            <Metric label={t('reports.incoming')} value={money.format(data.incoming)} accent={colors.success} />
            <Metric label={t('reports.materialCost')} value={money.format(data.materialCost)} />
            <Metric label={t('reports.laborCost')} value={money.format(data.laborCost)} />
            <Metric label={t('reports.netProfit')} value={money.format(data.netProfit)} accent={data.netProfit >= 0 ? colors.success : colors.danger} />
          </View>

          <View className="gap-2">
            <Text className="text-white text-base font-semibold">{t('reports.planFakt')}</Text>
            <View className="rounded-2xl border border-border/40 bg-black/20 overflow-hidden">
              <View className="flex-row px-3 py-2 border-b border-border/40">
                <Text className="text-muted text-[11px] uppercase flex-1">{t('reports.category')}</Text>
                <Text className="text-muted text-[11px] uppercase w-24 text-right">{t('reports.planned')}</Text>
                <Text className="text-muted text-[11px] uppercase w-24 text-right">{t('reports.fakt')}</Text>
              </View>
              {data.planFakt.map((p) => (
                <View key={p.category} className="flex-row px-3 py-2.5 border-b border-border/20">
                  <Text className="text-white text-sm flex-1">{t(`reports.cat${p.category}`)}</Text>
                  <Text className="text-muted text-sm w-24 text-right">{money.format(p.planned)}</Text>
                  <Text className="text-white text-sm w-24 text-right">{money.format(p.fakt)}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View className="rounded-2xl border border-border/40 bg-black/20 p-4" style={{ width: '47%' }}>
      <Text className="text-muted text-[11px]" numberOfLines={1}>{label}</Text>
      <Text className="text-base font-bold mt-1" style={{ color: accent ?? colors.white }} numberOfLines={1}>{value}</Text>
    </View>
  );
}
