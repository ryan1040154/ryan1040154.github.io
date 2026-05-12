document.addEventListener("DOMContentLoaded", () => {
  const typewriter = document.getElementById("typewriter");
  const locationText = document.querySelector(".location-text");
  const canvas = document.getElementById("triangle-bg");
  const backToTop = document.querySelector(".back-to-top");

  if (locationText) {
    setTimeout(() => {
      locationText.classList.add("visible");
    }, 800);
  }

  if (typewriter) {
    const text = "Ryan Chuang";
    typewriter.textContent = "";
    let index = 0;

    const type = () => {
      if (index < text.length) {
        typewriter.textContent += text.charAt(index);
        index += 1;
        setTimeout(type, 110);
        return;
      }

      typewriter.style.borderRight = "none";
    };

    type();
  }

  if (backToTop) {
    const toggleBackToTop = () => {
      backToTop.classList.toggle("visible", window.scrollY > 520);
    };

    window.addEventListener("scroll", toggleBackToTop, { passive: true });
    toggleBackToTop();

    backToTop.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext("2d");
  const triangles = [];
  const triangleCount = 26;

  function resizeCanvas() {
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }

  class Triangle {
    constructor() {
      this.reset(true);
    }

    reset(randomY = false) {
      this.x = Math.random() * canvas.offsetWidth;
      this.y = randomY ? Math.random() * canvas.offsetHeight : -60;
      this.size = 18 + Math.random() * 46;
      this.speedY = 0.25 + Math.random() * 0.65;
      this.speedX = (Math.random() - 0.5) * 0.25;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = (Math.random() - 0.5) * 1.4;
      this.alpha = 0.05 + Math.random() * 0.12;
    }

    update() {
      this.y += this.speedY;
      this.x += this.speedX;
      this.rotation += this.rotationSpeed;

      if (this.y > canvas.offsetHeight + this.size) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.beginPath();
      ctx.moveTo(0, -this.size / 2);
      ctx.lineTo(-this.size / 2, this.size / 2);
      ctx.lineTo(this.size / 2, this.size / 2);
      ctx.closePath();
      ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
      ctx.fill();
      ctx.restore();
    }
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  for (let i = 0; i < triangleCount; i += 1) {
    triangles.push(new Triangle());
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    triangles.forEach((triangle) => {
      triangle.update();
      triangle.draw();
    });
    requestAnimationFrame(animate);
  }

  animate();
});
