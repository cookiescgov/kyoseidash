const { checkLogin } = require("../util-server");
const { R } = require("redbean-node");

/**
 * Kyosei Dash — fetch recent heartbeat channel history for a monitor.
 * @param {Socket} socket Socket.io instance
 * @returns {void}
 */
module.exports.channelsSocketHandler = (socket) => {
    socket.on("getChannelHistory", async (monitorID, hours, callback) => {
        try {
            checkLogin(socket);
            const h = Math.max(1, Math.min(Number(hours) || 24, 720));
            const rows = await R.getAll(
                `SELECT time, channels, ping FROM heartbeat
                 WHERE monitor_id = ? AND channels IS NOT NULL AND time >= datetime('now', ?)
                 ORDER BY time ASC LIMIT 5000`,
                [ monitorID, `-${h} hours` ]
            );
            const points = rows.map((r) => ({
                t: r.time,
                ping: r.ping,
                channels: r.channels ? JSON.parse(r.channels) : {},
            }));
            callback({ ok: true, points });
        } catch (e) {
            callback({ ok: false, msg: e.message });
        }
    });

    socket.on("getNetworkOverview", async (callback) => {
        try {
            checkLogin(socket);
            // Latest heartbeat per PRTG monitor
            const monitors = await R.getAll(
                `SELECT m.id, m.name, m.prtg_device
                 FROM monitor m
                 WHERE m.type = 'prtg' AND m.active = 1`
            );
            const items = [];
            for (const m of monitors) {
                const hb = await R.getRow(
                    `SELECT time, status, ping, channels FROM heartbeat
                     WHERE monitor_id = ? AND channels IS NOT NULL
                     ORDER BY time DESC LIMIT 1`,
                    [ m.id ]
                );
                if (hb) {
                    items.push({
                        id: m.id,
                        name: m.name,
                        device: m.prtg_device,
                        time: hb.time,
                        status: hb.status,
                        ping: hb.ping,
                        channels: hb.channels ? JSON.parse(hb.channels) : {},
                    });
                }
            }
            callback({ ok: true, items });
        } catch (e) {
            callback({ ok: false, msg: e.message });
        }
    });
};
