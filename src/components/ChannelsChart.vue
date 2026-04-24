<template>
    <div>
        <div class="d-flex justify-content-between align-items-center mb-2">
            <strong>{{ title }}</strong>
            <select v-model.number="hours" class="form-select form-select-sm w-auto" @change="load">
                <option :value="1">1h</option>
                <option :value="6">6h</option>
                <option :value="24">24h</option>
                <option :value="168">7d</option>
            </select>
        </div>
        <div v-if="!series.length" class="text-muted small">No channel history yet.</div>
        <Line v-else :data="chartData" :options="chartOptions" />
    </div>
</template>

<script>
import { Chart, LineController, LineElement, PointElement, LinearScale, TimeScale, Filler, Tooltip, Legend } from "chart.js";
import "chartjs-adapter-dayjs-4";
import { Line } from "vue-chartjs";

Chart.register(LineController, LineElement, PointElement, LinearScale, TimeScale, Filler, Tooltip, Legend);

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

export default {
    components: { Line },
    props: {
        monitorId: { type: Number, required: true },
    },
    data() {
        return {
            hours: 24,
            points: [],
        };
    },
    computed: {
        /** Distinct channel keys sorted */
        channelKeys() {
            const keys = new Set();
            for (const p of this.points) {
                for (const k of Object.keys(p.channels || {})) keys.add(k);
            }
            return [ ...keys ].sort();
        },
        series() {
            return this.channelKeys.map((k, i) => ({
                label: k,
                borderColor: COLORS[i % COLORS.length],
                backgroundColor: COLORS[i % COLORS.length] + "33",
                fill: this.chartKind === "bandwidth",
                data: this.points
                    .map((p) => ({ x: new Date(p.t), y: typeof p.channels[k] === "number" ? p.channels[k] : null }))
                    .filter((d) => d.y !== null),
                tension: 0.2,
                borderWidth: 2,
                pointRadius: 0,
            }));
        },
        chartKind() {
            const ks = this.channelKeys.map((k) => k.toLowerCase());
            if (ks.some((k) => k.includes("bps") || k.includes("traffic in") || k.includes("traffic out"))) return "bandwidth";
            if (ks.some((k) => k.includes("latency") || k.includes("jitter") || k.includes("ping"))) return "latency";
            return "generic";
        },
        title() {
            return {
                bandwidth: "Bandwidth",
                latency: "Latency / Jitter",
                generic: "Channels",
            }[this.chartKind];
        },
        chartData() {
            return { datasets: this.series };
        },
        chartOptions() {
            return {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                scales: {
                    x: { type: "time", time: { minUnit: "minute" } },
                    y: { beginAtZero: true },
                },
                plugins: { legend: { display: true, position: "top" } },
            };
        },
    },
    mounted() {
        this.load();
    },
    methods: {
        load() {
            this.$root.getSocket().emit("getChannelHistory", this.monitorId, this.hours, (res) => {
                if (res && res.ok) {
                    this.points = res.points || [];
                }
            });
        },
    },
};
</script>

<style scoped>
div :deep(canvas) { height: 260px !important; }
</style>
