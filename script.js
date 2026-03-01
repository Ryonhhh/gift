const audio = document.getElementById('audio-player');
const lyricsList = document.getElementById('lyrics-list');
const playBtn = document.getElementById('play-btn');

let lyricsData = []; // 存储解析后的歌词对象

// 1. 初始化：加载歌词文件
fetch('lyrics.lrc')
    .then(response => response.text())
    .then(text => {
        lyricsData = parseLRC(text);
        renderLyrics(lyricsData);
    });

// 2. 解析 LRC 格式
function parseLRC(lrcText) {
    const lines = lrcText.split('\n');
    const result = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
    
    lines.forEach(line => {
        const match = timeRegex.exec(line);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const milliseconds = parseInt(match[3]);
            // 将时间转换为秒
            const time = minutes * 60 + seconds + milliseconds / 1000;
            const text = line.replace(timeRegex, '').trim();
            if (text) { // 只有当有文本时才添加
                result.push({ time, text });
            }
        }
    });
    return result;
}

// 3. 渲染歌词到页面
function renderLyrics(data) {
    lyricsList.innerHTML = '';
    data.forEach((line, index) => {
        const li = document.createElement('li');
        li.textContent = line.text;
        li.dataset.index = index; // 存一下索引方便后续查找
        lyricsList.appendChild(li);
    });
}

// 4. 监听播放进度，实现滚动
audio.addEventListener('timeupdate', () => {
    const currentTime = audio.currentTime;
    
    // 找到当前应该高亮的那一行
    // 逻辑：找到最后一个时间小于当前时间的歌词
    let activeIndex = -1;
    for (let i = 0; i < lyricsData.length; i++) {
        if (currentTime >= lyricsData[i].time) {
            activeIndex = i;
        } else {
            break; 
        }
    }

    if (activeIndex !== -1) {
        updateActiveLyric(activeIndex);
    }
});

function updateActiveLyric(index) {
    // 移除旧的高亮
    const currentActive = document.querySelector('.active');
    if (currentActive) currentActive.classList.remove('active');

    // 添加新的高亮
    const rows = lyricsList.querySelectorAll('li');
    if (rows[index]) {
        rows[index].classList.add('active');

        // --- 核心滚动算法 ---
        // 计算偏移量：让当前行处于容器中间
        // 这里的 30 是近似的行高，你可以根据 CSS调整
        const offset = index * 40; 
        lyricsList.style.transform = `translateY(-${offset}px)`;
    }
}

// 5. 播放按钮逻辑（解决手机浏览器自动播放限制）
playBtn.addEventListener('click', () => {
    if (audio.paused) {
        audio.play();
        playBtn.textContent = '暂停';
    } else {
        audio.pause();
        playBtn.textContent = '播放';
    }
});

// 6. 粒子动效
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
const SYMBOLS = ['♪', '♫', '♩', '✦', '·', '✧', '♡', '❤', '💕', '💗'];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Particle {
    constructor() { this.reset(true); }
    reset(initial = false) {
        this.x = Math.random() * canvas.width;
        this.y = initial ? Math.random() * canvas.height : canvas.height + 20;
        this.symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        this.size = 10 + Math.random() * 14;
        this.speedY = 0.4 + Math.random() * 0.8;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.alpha = 0;
        this.alphaDir = 0.01 + Math.random() * 0.015;
        this.maxAlpha = 0.15 + Math.random() * 0.25;
    }
    update() {
        this.y -= this.speedY;
        this.x += this.speedX;
        if (this.alpha < this.maxAlpha) this.alpha += this.alphaDir;
        if (this.y < canvas.height * 0.3) this.alpha -= this.alphaDir * 1.5;
        if (this.alpha <= 0 || this.y < -20) this.reset();
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = '#ffffff';
        ctx.font = `${this.size}px serif`;
        ctx.textAlign = 'center';
        ctx.fillText(this.symbol, this.x, this.y);
        ctx.restore();
    }
}

const particles = Array.from({ length: 30 }, () => new Particle());
let animationId = null;

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    animationId = requestAnimationFrame(animateParticles);
}

audio.addEventListener('play', () => {
    if (!animationId) animateParticles();
});
audio.addEventListener('pause', () => {
    if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});
