<script lang="ts">
    import { onMount } from "svelte";
    import { CasinoClient, ClientEvent } from "casino-sdk";

    const urlParams = new URLSearchParams(window.location.search);
    const wsUrl = urlParams.get("wsUrl") || "ws://localhost:9000/ws";
    const token = urlParams.get("token") || "";
    const session = parseInt(urlParams.get("session") || "0");
    const useSDK = (urlParams.get("usesdk") || "").length > 0;

    const client = new CasinoClient(wsUrl, {
        authenticateFromLocalStorage: false,
        clientType: "game-sdk",
        token,
        session,
    });

    client.on(ClientEvent.AUTH_SUCCESS, () => {
        client.sendGameFinishedLoading();
    });

    const wallet = client.casino.wallet;
    const walletStore = useSDK ? wallet.store : null;
    let volatileBalance = 250; // Default balance for non-SDK mode

    let symbols = ["🍒", "🍋", "🍊", "🍉", "🍇", "⭐"];
    let rows = 3;
    let cols = 5;
    let state: string[][] = Array.from({ length: rows }, () =>
        Array(cols).fill(""),
    );
    let spacePressed = false;
    let spinning = false;
    let spinInterval: ReturnType<typeof setInterval> | null = null;
    let message = "";
    let winType = "";
    let showJackpot = false;
    let showOtherWin = false;
    let winMatrix: boolean[][] = Array.from({ length: rows }, () =>
        Array(cols).fill(false),
    );
    const SPIN_COST = 5;
    const JACKPOT_REWARD = 50;
    const COLUMN_REWARD = 10;
    const DIAGONAL_REWARD = 15;

    onMount(async () => {
        if (useSDK) await client.connect();
    });

    function clearWinMatrix() {
        winMatrix = Array.from({ length: rows }, () => Array(cols).fill(false));
    }

    function randomizeState() {
        state = Array.from({ length: rows }, () =>
            Array.from(
                { length: cols },
                () => symbols[Math.floor(Math.random() * symbols.length)],
            ),
        );
    }

    function checkWin(
        state: string[][],
    ): { type: string; reward: number } | null {
        clearWinMatrix();
        // 5 in a row (horizontal)
        for (let r = 0; r < rows; r++) {
            if (state[r].every((symbol) => symbol === state[r][0])) {
                for (let c = 0; c < cols; c++) winMatrix[r][c] = true;
                return { type: "JACKPOT! 5 in a row", reward: JACKPOT_REWARD };
            }
        }
        // 3 in a column
        for (let col = 0; col < cols; col++) {
            if (
                state[0][col] === state[1][col] &&
                state[1][col] === state[2][col]
            ) {
                for (let r = 0; r < 3; r++) winMatrix[r][col] = true;
                return { type: "3 in a column", reward: COLUMN_REWARD };
            }
        }
        // 3 in a diagonal (top-left to bottom-right)
        if (state[0][0] === state[1][1] && state[1][1] === state[2][2]) {
            winMatrix[0][0] = winMatrix[1][1] = winMatrix[2][2] = true;
            return { type: "3 in a diagonal", reward: DIAGONAL_REWARD };
        }
        // 3 in a diagonal (top-right to bottom-left)
        if (state[0][4] === state[1][3] && state[1][3] === state[2][2]) {
            winMatrix[0][4] = winMatrix[1][3] = winMatrix[2][2] = true;
            return { type: "3 in a diagonal", reward: DIAGONAL_REWARD };
        }
        return null;
    }

    function triggerWinAnimation(type: string) {
        if (type.includes("JACKPOT")) {
            playSound(jackpotSound);
            showJackpot = false;
            setTimeout(() => {
                showJackpot = true;
            }, 10);
            setTimeout(() => {
                showJackpot = false;
            }, 3500);
        } else {
            playSound(winSound);
            showOtherWin = false;
            setTimeout(() => {
                showOtherWin = true;
            }, 10);
            setTimeout(() => {
                showOtherWin = false;
            }, 2000);
        }
    }

    function spin() {
        if (
            spinning ||
            (useSDK && $walletStore
                ? $walletStore.NetworthCents / 100
                : volatileBalance) < SPIN_COST
        )
            return;
        playSound(spinSound);
        spinning = true;
        message = "";
        winType = "";
        clearWinMatrix();
        if (useSDK) {
            wallet.removeFunds(SPIN_COST * 100); // deduct spin cost from wallet
        } else {
            volatileBalance -= SPIN_COST; // deduct spin cost from volatile balance
        }
        let elapsed = 0;
        const duration = 1000; // ms
        const interval = 50; // ms
        spinInterval = setInterval(() => {
            randomizeState();
            clearWinMatrix();
            elapsed += interval;
            if (elapsed >= duration) {
                clearInterval(spinInterval!);
                spinInterval = null;
                spinning = false;
                // Final result
                randomizeState();
                const win = checkWin(state);
                if (win) {
                    if (useSDK) {
                        wallet.addFunds(win.reward * 100); // add win to wallet
                    } else {
                        volatileBalance += win.reward; // add win to volatile balance
                    }
                    message = `🎉 ${win.type}! You win $${win.reward} 🎉`;
                    winType = win.type;
                    triggerWinAnimation(win.type);
                } else if (
                    useSDK &&
                    $walletStore &&
                    $walletStore.NetworthCents / 100 < SPIN_COST
                ) {
                    message = "Game over! Not enough budget to spin.";
                }
            }
        }, interval);
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.code === "Space" && !spacePressed) {
            spacePressed = true;
            spin();
        }
    }

    function handleKeyup(e: KeyboardEvent) {
        if (e.code === "Space") {
            spacePressed = false;
        }
    }

    // --- TESTING COMMANDS FOR F12 CONSOLE ---
    function forceJackpot() {
        state = Array.from({ length: rows }, () =>
            Array(cols).fill(symbols[0]),
        );
        clearWinMatrix();
        checkWin(state);
        message = `🎉 JACKPOT! 5 in a row! You win $${JACKPOT_REWARD} 🎉`;
        winType = "JACKPOT! 5 in a row";
        triggerWinAnimation(winType);
    }
    function forceColumnWin() {
        state = Array.from({ length: rows }, () =>
            Array(cols).fill(symbols[1]),
        );
        // Only column 0 is a win
        for (let r = 0; r < rows; r++) state[r][0] = symbols[2];
        clearWinMatrix();
        for (let r = 0; r < rows; r++) state[r][2] = symbols[3]; // break other columns
        state[0][0] = state[1][0] = state[2][0] = symbols[1];
        checkWin(state);
        message = `🎉 3 in a column! You win $${COLUMN_REWARD} 🎉`;
        winType = "3 in a column";
        triggerWinAnimation(winType);
    }
    function forceDiagonalWin() {
        state = Array.from({ length: rows }, () =>
            Array(cols).fill(symbols[4]),
        );
        clearWinMatrix();
        state[0][0] = state[1][1] = state[2][2] = symbols[5];
        checkWin(state);
        message = `🎉 3 in a diagonal! You win $${DIAGONAL_REWARD} 🎉`;
        winType = "3 in a diagonal";
        triggerWinAnimation(winType);
    }
    function forceNoWin() {
        state = Array.from({ length: rows }, () =>
            Array(cols).fill(symbols[0]),
        );
        state[0][0] = symbols[1];
        clearWinMatrix();
        checkWin(state);
        message = "No win!";
        winType = "";
        showJackpot = false;
        showOtherWin = false;
    }

    // Sound effects
    const spinSound = new Audio("sounds/spin.flac");
    const winSound = new Audio("sounds/win.mp3");
    const jackpotSound = new Audio("sounds/jackpot.mp3");

    function playSound(sound: HTMLAudioElement) {
        sound.currentTime = 0;
        sound.play();
    }

    function unlockSounds() {
        // Play a nearly-silent sound to unlock audio
        spinSound.volume = 0.01;
        spinSound
            .play()
            .then(() => {
                spinSound.pause();
                spinSound.currentTime = 0;
                spinSound.volume = 1;
            })
            .catch(() => {});
        winSound.load();
        jackpotSound.load();
        window.removeEventListener("pointerdown", unlockSounds);
        window.removeEventListener("keydown", unlockSounds);
    }

    onMount(() => {
        window.addEventListener("pointerdown", unlockSounds);
        window.addEventListener("keydown", unlockSounds);
        randomizeState();
        // Expose test functions for F12 console
        (window as any).forceJackpot = forceJackpot;
        (window as any).forceColumnWin = forceColumnWin;
        (window as any).forceDiagonalWin = forceDiagonalWin;
        (window as any).forceNoWin = forceNoWin;
        return () => {
            window.removeEventListener("keydown", handleKeydown);
            window.removeEventListener("keyup", handleKeyup);
            if (spinInterval) clearInterval(spinInterval);
        };
    });
</script>

<main class:crazy-jackpot={showJackpot}>
    <h1>Welcome to SLOTTY!</h1>
    <div class="budget">
        Budget: {($walletStore
            ? $walletStore.NetworthCents / 100
            : volatileBalance / 100
        ).toFixed(2)}$
    </div>
    <table class="slot-table" class:spinning class:other-win={showOtherWin}>
        <tbody>
            {#each state as row, r}
                <tr>
                    {#each row as symbol, c}
                        <td class:win-cell={winMatrix[r][c]}>{symbol}</td>
                    {/each}
                </tr>
            {/each}
        </tbody>
    </table>
    <button
        id="spin-btn"
        on:click={spin}
        disabled={spinning ||
            ($walletStore
                ? $walletStore.NetworthCents / 100
                : volatileBalance / 100) < SPIN_COST}
        >Spin (or press Space)</button
    >
    {#if message}
        <div
            class="message"
            class:jackpot-message={showJackpot}
            class:otherwin-message={showOtherWin}
        >
            {message}
        </div>
    {/if}
    {#if showJackpot}
        <div class="confetti"></div>
        <div class="jackpot-explosion">
            <span>💥💰 JACKPOT!!! 💰💥</span>
            <span class="emoji">🎆🎇🎉🎊🤑</span>
        </div>
    {/if}
</main>

<style>
    main {
        position: fixed;
        top: 0;
        left: 0;

        width: 100vw;
        height: 100vh;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        background: #fff;
        border-radius: 0;
        box-shadow: none;
        padding: 0;
        text-align: center;
    }
    .budget {
        font-size: 1.3rem;
        margin-bottom: 10px;
        font-weight: bold;
    }
    .message {
        margin-top: 15px;
        font-size: 1.2rem;
        color: #27ae60;
        font-weight: bold;
        animation: pop 0.5s;
    }
    @keyframes pop {
        0% {
            transform: scale(0.8);
            opacity: 0;
        }
        60% {
            transform: scale(1.1);
            opacity: 1;
        }
        100% {
            transform: scale(1);
        }
    }
    .slot-table {
        margin: 20px auto;
        border-collapse: collapse;
        transition: filter 0.2s;
        width: 90vw;
        max-width: 700px;
        height: 50vh;
        max-height: 400px;
        table-layout: fixed;
    }
    .slot-table.spinning {
        filter: brightness(1.2) blur(1px);
    }
    .slot-table td {
        width: 18vw;
        max-width: 120px;
        height: 16vh;
        max-height: 120px;
        border: 2px solid #35424a;
        font-size: 3.5vw;
        min-font-size: 2rem;
        text-align: center;
        background: #fafafa;
        transition: transform 0.2s;
    }
    .slot-table.spinning td {
        animation: spin-td 0.3s linear infinite alternate;
    }
    @keyframes spin-td {
        0% {
            transform: scale(1) rotate(-5deg);
        }
        100% {
            transform: scale(1.1) rotate(5deg);
        }
    }
    #spin-btn {
        padding: 10px 30px;
        font-size: 1.2rem;
        background: #35424a;
        color: #fff;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background 0.2s;
    }
    #spin-btn:disabled {
        background: #888;
        cursor: not-allowed;
    }
    #spin-btn:hover:enabled {
        background: #2c3e50;
    }
    .confetti {
        pointer-events: none;
        position: fixed;
        left: 0;
        top: 0;
        width: 100vw;
        height: 100vh;
        z-index: 1000;
        background: none;
    }
    .jackpot-explosion {
        position: fixed;
        left: 50%;
        top: 30%;
        transform: translate(-50%, -50%) scale(1.2);
        z-index: 2000;
        font-size: 3rem;
        color: #fff700;
        text-shadow:
            2px 2px 8px #ff00c8,
            0 0 20px #00fff7;
        animation:
            jackpot-pop 1.2s cubic-bezier(0.36, 0.07, 0.19, 0.97) 1,
            jackpot-fade 2.5s 1.2s forwards;
        pointer-events: none;
        text-align: center;
    }
    .jackpot-explosion .emoji {
        display: block;
        font-size: 2.5rem;
        margin-top: 0.5em;
        animation: emoji-bounce 1.2s infinite alternate;
    }
    @keyframes jackpot-pop {
        0% {
            transform: translate(-50%, -50%) scale(0.2);
            opacity: 0;
        }
        60% {
            transform: translate(-50%, -50%) scale(1.3);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 1;
        }
    }
    @keyframes jackpot-fade {
        0% {
            opacity: 1;
        }
        100% {
            opacity: 0;
        }
    }
    @keyframes emoji-bounce {
        0% {
            transform: translateY(0);
        }
        100% {
            transform: translateY(-20px) scale(1.2);
        }
    }
    .jackpot-message {
        color: #fff700;
        font-size: 2rem;
        text-shadow:
            2px 2px 8px #ff00c8,
            0 0 20px #00fff7;
        animation: jackpot-pop 1.2s cubic-bezier(0.36, 0.07, 0.19, 0.97) 1;
    }
    .other-win {
        animation: win-bounce 0.7s cubic-bezier(0.36, 0.07, 0.19, 0.97) 2;
        background: linear-gradient(90deg, #b2ffb2 0%, #b2e0ff 100%);
    }
    @keyframes win-bounce {
        0% {
            transform: scale(1);
        }
        30% {
            transform: scale(1.1) rotate(-2deg);
        }
        60% {
            transform: scale(0.95) rotate(2deg);
        }
        100% {
            transform: scale(1);
        }
    }
    .otherwin-message {
        color: #00c853;
        font-size: 1.5rem;
        text-shadow:
            1px 1px 6px #fff,
            0 0 10px #b2ffb2;
        animation: win-bounce 0.7s cubic-bezier(0.36, 0.07, 0.19, 0.97) 2;
    }
    .win-cell {
        background: linear-gradient(90deg, #fff700 0%, #ff00c8 100%);
        color: #222;
        border: 3px solid #ff00c8;
        box-shadow:
            0 0 16px 4px #fff700,
            0 0 8px 2px #ff00c8;
        animation: win-pop 0.7s cubic-bezier(0.36, 0.07, 0.19, 0.97) 2;
        z-index: 2;
        position: relative;
    }
    @keyframes win-pop {
        0% {
            transform: scale(1);
        }
        30% {
            transform: scale(1.2) rotate(-2deg);
        }
        60% {
            transform: scale(0.95) rotate(2deg);
        }
        100% {
            transform: scale(1);
        }
    }

    @media (prefers-color-scheme: dark) {
        body,
        main {
            background: #181a20 !important;
            color: #f0f0f0;
        }
        main {
            box-shadow: none;
            border-radius: 0;
            background: #23272f !important;
        }
        .budget {
            color: #fff;
        }
        .slot-table {
            background: #23272f;
            border-color: #444;
        }
        .slot-table td {
            background: #23272f;
            color: #fff;
            border: 2px solid #444;
        }
        .slot-table.spinning {
            filter: brightness(1.1) blur(1px);
        }
        #spin-btn {
            background: #444b5a;
            color: #fff;
        }
        #spin-btn:disabled {
            background: #333;
            color: #aaa;
        }
        #spin-btn:hover:enabled {
            background: #2c3e50;
        }
        .message {
            color: #00e676;
            text-shadow:
                1px 1px 6px #111,
                0 0 10px #00e676;
        }
        .jackpot-message {
            color: #ffe600;
            text-shadow:
                2px 2px 8px #ff00c8,
                0 0 20px #00fff7;
        }
        .otherwin-message {
            color: #00e676;
            text-shadow:
                1px 1px 6px #111,
                0 0 10px #00e676;
        }
        .win-cell {
            background: linear-gradient(90deg, #ffe600 0%, #ff00c8 100%);
            color: #181a20;
            border: 3px solid #ff00c8;
            box-shadow:
                0 0 16px 4px #ffe600,
                0 0 8px 2px #ff00c8;
        }
        .jackpot-explosion {
            color: #ffe600;
            text-shadow:
                2px 2px 8px #ff00c8,
                0 0 20px #00fff7;
        }
        .other-win {
            background: linear-gradient(90deg, #1b5e20 0%, #01579b 100%);
        }
    }
</style>
