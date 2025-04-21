window.onload = function () {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars = [];
    const numStars = 200;

    class Star {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            // 减小星星大小
            this.size = Math.random() * 1;
            // 让星星向右上方移动，速率不同
            this.speedX = Math.random() * 0.1 + 0.1;
            this.speedY = -(Math.random() * 0.1 + 0.1);
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x > canvas.width) {
                this.x = 0;
            }
            if (this.y < 0) {
                this.y = canvas.height;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fill();
        }
    }

    for (let i = 0; i < numStars; i++) {
        stars.push(new Star());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < stars.length; i++) {
            stars[i].update();
            stars[i].draw();
        }

        requestAnimationFrame(animate);
    }

    animate();

    window.addEventListener('resize', function () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
};
    