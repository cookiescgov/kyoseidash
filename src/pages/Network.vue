<template>
    <transition name="slide-fade" appear>
        <div>
            <h1 class="mb-3">{{ $t("Network") }}</h1>
            <p class="text-muted">{{ $t("Live view of all PRTG-backed monitors. Uses the latest heartbeat per sensor.") }}</p>

            <div v-if="!items.length" class="shadow-box big-padding text-center text-muted">
                No PRTG monitors with recent channel data yet.
            </div>

            <div v-else class="row g-3">
                <div class="col-12 col-md-6">
                    <div class="shadow-box big-padding">
                        <h3 class="mb-3">Top 10 by throughput (Mbps total)</h3>
                        <ol class="mb-0">
                            <li v-for="r in topThroughput" :key="r.id">
                                <router-link :to="`/dashboard/${r.id}`">{{ r.name }}</router-link>
                                — <strong>{{ fmtMbps(r.total) }}</strong>
                                <span class="text-muted small">
                                    (↓ {{ fmtMbps(r.inBps) }} / ↑ {{ fmtMbps(r.outBps) }})
                                </span>
                            </li>
                        </ol>
                        <p v-if="!topThroughput.length" class="text-muted mb-0">No bandwidth channels detected.</p>
                    </div>
                </div>
                <div class="col-12 col-md-6">
                    <div class="shadow-box big-padding">
                        <h3 class="mb-3">Highest latency</h3>
                        <ol class="mb-0">
                            <li v-for="r in topLatency" :key="r.id">
                                <router-link :to="`/dashboard/${r.id}`">{{ r.name }}</router-link>
                                — <strong>{{ r.latency.toFixed(1) }} ms</strong>
                            </li>
                        </ol>
                        <p v-if="!topLatency.length" class="text-muted mb-0">No latency channels detected.</p>
                    </div>
                </div>
                <div class="col-12 col-md-6">
                    <div class="shadow-box big-padding">
                        <h3 class="mb-3">Packet loss leaderboard</h3>
                        <ol class="mb-0">
                            <li v-for="r in topLoss" :key="r.id">
                                <router-link :to="`/dashboard/${r.id}`">{{ r.name }}</router-link>
                                — <strong>{{ r.loss.toFixed(1) }}%</strong>
                            </li>
                        </ol>
                        <p v-if="!topLoss.length" class="text-muted mb-0">No packet-loss channels detected.</p>
                    </div>
                </div>
                <div class="col-12 col-md-6">
                    <div class="shadow-box big-padding">
                        <h3 class="mb-3">Interface errors</h3>
                        <ol class="mb-0">
                            <li v-for="r in topErrors" :key="r.id">
                                <router-link :to="`/dashboard/${r.id}`">{{ r.name }}</router-link>
                                — <strong>{{ r.errors }}</strong>
                            </li>
                        </ol>
                        <p v-if="!topErrors.length" class="text-muted mb-0">No error counters detected.</p>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
function findChannel(channels, predicates) {
    const keys = Object.keys(channels || {});
    for (const p of predicates) {
        const k = keys.find((key) => p.test(key.toLowerCase()));
        if (k && typeof channels[k] === "number") return channels[k];
    }
    return null;
}

export default {
    data() {
        return { items: [], timer: null };
    },
    computed: {
        topThroughput() {
            return this.items
                .map((it) => {
                    const inBps = findChannel(it.channels, [/in.*bps|bits in|traffic in/i]) || 0;
                    const outBps = findChannel(it.channels, [/out.*bps|bits out|traffic out/i]) || 0;
                    return { ...it, inBps, outBps, total: inBps + outBps };
                })
                .filter((r) => r.total > 0)
                .sort((a, b) => b.total - a.total)
                .slice(0, 10);
        },
        topLatency() {
            return this.items
                .map((it) => ({ ...it, latency: findChannel(it.channels, [/avg.*ms|latency.*ms|^latency|rtt/i]) || 0 }))
                .filter((r) => r.latency > 0)
                .sort((a, b) => b.latency - a.latency)
                .slice(0, 10);
        },
        topLoss() {
            return this.items
                .map((it) => ({ ...it, loss: findChannel(it.channels, [/packet loss|loss.*%|packetloss/i]) || 0 }))
                .filter((r) => r.loss > 0)
                .sort((a, b) => b.loss - a.loss)
                .slice(0, 10);
        },
        topErrors() {
            return this.items
                .map((it) => ({ ...it, errors: findChannel(it.channels, [/errors in|errors out|interface errors/i]) || 0 }))
                .filter((r) => r.errors > 0)
                .sort((a, b) => b.errors - a.errors)
                .slice(0, 10);
        },
    },
    mounted() {
        this.load();
        this.timer = setInterval(this.load, 30000);
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
    },
    methods: {
        load() {
            this.$root.getSocket().emit("getNetworkOverview", (res) => {
                if (res && res.ok) this.items = res.items || [];
            });
        },
        fmtMbps(bps) {
            if (!bps) return "0 Mbps";
            const mbps = bps / 1_000_000;
            if (mbps >= 1000) return `${(mbps / 1000).toFixed(2)} Gbps`;
            if (mbps >= 1) return `${mbps.toFixed(1)} Mbps`;
            return `${(bps / 1000).toFixed(1)} Kbps`;
        },
    },
};
</script>
