/* js/splitRoad.js */
(function(){
  function clamp01(x){ return Math.max(0, Math.min(1, x)); }
  function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }
  function easeInOutQuad(t){ return t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2; }

  window.initSplitRoad = function mount(selector, opts = {}){
    const root = document.querySelector(selector);
    if(!root) return console.warn('initSplitRoad: container not found:', selector);

    // Create map scaffold (HTML kept tiny)
    root.innerHTML = `
      <div class="map" id="da-map">
        <div class="trunk" id="da-trunk"></div>
        <div class="start-lane">Start</div>
        <div class="car" id="da-car">
          <div class="car-body"></div>
          <div class="car-roof"></div>
          <div class="wheel left"></div>
          <div class="wheel right"></div>
          <div class="headlight left"></div>
          <div class="headlight right"></div>
        </div>
        <div class="hint">💡 Click a street sign — the car drives there.</div>
      </div>
    `;

    // Options
    const labels = opts.labels || ['Teen Class','Adult Class','Behind-the-Wheel','Road Test','FAQs','Contact'];
    const labelToUrl = opts.labelToUrl || {};

    // Elements
    const mapEl  = root.querySelector('#da-map');
    const carEl  = root.querySelector('#da-car');

    // State
    let splitY = 0, trunkX = 0, targets = [];
    let animId = null, isAnimating = false;

    function build(){
      // Remove any old branches/signs
      Array.from(mapEl.querySelectorAll('.branch,.sign,.pole')).forEach(n => n.remove());
      targets = [];

      const rect = mapEl.getBoundingClientRect();
      trunkX = rect.width / 2;
      splitY = Math.round(rect.height * 0.28);

      const pad = 60, n = labels.length;
      const xs = Array.from({length:n}, (_,i)=> pad + i * ((rect.width - pad*2) / (n-1)));

      xs.forEach((endX, i) => {
        // branch
        const left  = Math.min(trunkX, endX);
        const width = Math.abs(endX - trunkX);
        const branch = document.createElement('div');
        branch.className = 'branch';
        branch.style.left = `${left}px`;
        branch.style.top  = `${splitY - 35}px`;
        branch.style.width = `${Math.max(width, 80)}px`;
        mapEl.appendChild(branch);

        // sign
        const sign = document.createElement('button');
        sign.className = 'sign';
        sign.textContent = labels[i];
        sign.style.left = `${endX}px`;
        sign.style.top  = `${splitY - 40}px`;
        sign.addEventListener('click', () => {
          goTo(i);
          const href = labelToUrl[labels[i]];
          if (href) setTimeout(() => { window.location.href = href; }, 1600);
        });
        mapEl.appendChild(sign);

        // pole
        const pole = document.createElement('div');
        pole.className = 'pole';
        pole.style.left = `${endX}px`;
        pole.style.top  = `${splitY - 8}px`;
        mapEl.appendChild(pole);

        targets.push({ x:endX, y:splitY - 50 });
      });

      centerCar();
    }

    function centerCar(){
      const rect = mapEl.getBoundingClientRect();
      const x = trunkX - carEl.offsetWidth / 2;
      const y = rect.height - 26 - carEl.offsetHeight;
      carEl.style.transform = `translate(${x}px, ${y}px) rotate(0deg)`;
    }

    function goTo(index){
      if (isAnimating) return;
      const target = targets[index];

      const style  = getComputedStyle(carEl);
      const matrix = new DOMMatrixReadOnly(style.transform);
      let startX = matrix.m41, startY = matrix.m42;

      const phase1Y = splitY - 50;                       // up the trunk
      const alignX  = trunkX - carEl.offsetWidth / 2;    // center on trunk
      const endX    = target.x - carEl.offsetWidth / 2;  // branch end
      const endY    = target.y;

      const p1 = 700, p2 = 650, p3 = 450;
      const t0 = performance.now();
      isAnimating = true;
      cancelAnimationFrame(animId);

      function step(now){
        const t = now - t0;
        if (t <= p1){
          const s = easeOutCubic(clamp01(t/p1));
          const x = startX + (alignX - startX) * s;
          const y = startY + (phase1Y - startY) * s;
          carEl.style.transform = `translate(${x}px, ${y}px) rotate(0deg)`;
        } else if (t <= p1 + p2){
          const s = easeInOutQuad(clamp01((t - p1)/p2));
          const x = alignX + (endX - alignX) * s;
          carEl.style.transform = `translate(${x}px, ${phase1Y}px) rotate(0deg)`;
        } else if (t <= p1 + p2 + p3){
          const s = easeOutCubic(clamp01((t - p1 - p2)/p3));
          const y = phase1Y + (endY - phase1Y) * s;
          carEl.style.transform = `translate(${endX}px, ${y}px) rotate(0deg)`;
        } else {
          carEl.style.transform = `translate(${endX}px, ${endY}px) rotate(0deg)`;
          isAnimating = false;
          return;
        }
        animId = requestAnimationFrame(step);
      }
      animId = requestAnimationFrame(step);
    }

    // Build & wire resize
    build();
    window.addEventListener('resize', build);

    // Expose a tiny API if you want to update labels/links later
    return {
      setLabels(nextLabels, nextMap){
        opts.labels = nextLabels; opts.labelToUrl = nextMap || opts.labelToUrl;
        root.querySelectorAll('.sign,.branch,.pole').forEach(n => n.remove());
        build();
      }
    };
  };
})();
