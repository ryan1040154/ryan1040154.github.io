document.addEventListener("DOMContentLoaded", () => {
  const locationText = document.querySelector(".location-text");

  // 地址在圖片到位之後再出現
  setTimeout(() => {
    locationText.classList.add("visible");
  }, 1200); // 等圖片動畫結束後再顯示
});

document.addEventListener("DOMContentLoaded", () => {
  // 打字機效果
  const text = "Ryan Chuang 莊宸安";
  const typewriter = document.getElementById("typewriter");
  let i = 0;
  function type() {
    if (i < text.length) {
      typewriter.textContent += text.charAt(i);
      i++;
      setTimeout(type, 150);
    } else {
      typewriter.style.borderRight = "none";
    }
  }
  type();

  // 地址淡入
  const locationText = document.querySelector(".location-text");
  setTimeout(() => {
    locationText.classList.add("visible");
  }, 1500);

  // 🎨 三角形背景動畫
  const canvas = document.getElementById("triangle-bg");
  const ctx = canvas.getContext("2d");

  function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  class Triangle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = 20 + Math.random() * 40;
      this.speedY = 0.3 + Math.random() * 0.7;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = (Math.random() - 0.5) * 2;
      this.alpha = 0.05 + Math.random() * 0.1; // 半透明
    }
    update() {
      this.y += this.speedY;
      this.rotation += this.rotationSpeed;
      if (this.y > canvas.height + this.size) {
        this.reset();
        this.y = -this.size;
      }
    }
    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.beginPath();
      ctx.moveTo(0, -this.size / 2);
      ctx.lineTo(-this.size / 2, this.size / 2);
      ctx.lineTo(this.size / 2, this.size / 2);
      ctx.closePath();
      ctx.fillStyle = `rgba(255,255,255,${this.alpha})`;
      ctx.fill();
      ctx.restore();
    }
  }

  const triangles = Array.from({ length: 20 }, () => new Triangle());

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    triangles.forEach(tri => {
      tri.update();
      tri.draw(ctx);
    });
    requestAnimationFrame(animate);
  }
  animate();
});
