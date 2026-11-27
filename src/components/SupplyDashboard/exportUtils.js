// Pure browser SVG -> 2x Retina PNG export utilities (zero third-party libraries)

function svgToImage(svgEl) {
  return new Promise((resolve, reject) => {
    if (!svgEl) {
      reject(new Error('Missing SVG element'));
      return;
    }
    const clone = svgEl.cloneNode(true);
    const rect = svgEl.getBoundingClientRect();
    const vb = svgEl.viewBox?.baseVal;
    const width = vb && vb.width ? vb.width : rect.width || 600;
    const height = vb && vb.height ? vb.height : rect.height || 300;

    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', String(width));
    clone.setAttribute('height', String(height));

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ img, width, height });
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

function triggerDownload(canvas, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export async function exportChartSvgPng(svgEl, title, filename) {
  try {
    const { img, width, height } = await svgToImage(svgEl);
    const scale = 2;
    const pad = 24;
    const headerH = 38;
    const canvas = document.createElement('canvas');
    canvas.width = (width + pad * 2) * scale;
    canvas.height = (height + pad * 2 + headerH) * scale;

    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width + pad * 2, height + pad * 2 + headerH);

    ctx.fillStyle = '#1d1d1f';
    ctx.font = '600 15px -apple-system, Helvetica Neue, sans-serif';
    ctx.fillText(title, pad, pad + 14);

    ctx.fillStyle = '#86868b';
    ctx.font = '400 11px -apple-system, Helvetica Neue, sans-serif';
    ctx.fillText(
      `iSearch Supply Chain Control Tower · ${new Date().toLocaleDateString()}`,
      pad,
      pad + 30
    );

    ctx.drawImage(img, pad, pad + headerH, width, height);
    triggerDownload(canvas, filename);
  } catch {
    // Graceful no-op if browser blocks canvas serialization
  }
}

export async function exportFullDashboardPng({
  familyLabel,
  kpis,
  mapSvg,
  planSvg,
  donutSvg,
  capacitySvg,
  summaryText,
}) {
  const scale = 2;
  const W = 1320;
  const H = 820;
  const canvas = document.createElement('canvas');
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  // Canvas background
  ctx.fillStyle = '#f5f5f7';
  ctx.fillRect(0, 0, W, H);

  // Header bar
  ctx.fillStyle = '#1d1d1f';
  ctx.fillRect(0, 0, W, 52);
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 16px -apple-system, Helvetica Neue, sans-serif';
  ctx.fillText(`iSearch · Supply Chain Control Tower (${familyLabel})`, 24, 32);
  ctx.fillStyle = '#a1a1a6';
  ctx.font = '400 12px -apple-system, Helvetica Neue, sans-serif';
  ctx.fillText(`Exported ${new Date().toLocaleString()}`, W - 220, 32);

  // Helper to draw rounded white card
  const drawCard = (x, y, w, h, title) => {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e2e2e8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();
    ctx.stroke();
    if (title) {
      ctx.fillStyle = '#1d1d1f';
      ctx.font = '600 13px -apple-system, Helvetica Neue, sans-serif';
      ctx.fillText(title, x + 14, y + 22);
    }
  };

  // KPI strip
  const kpiW = (W - 48 - 36) / 4;
  kpis.forEach((k, i) => {
    const x = 24 + i * (kpiW + 12);
    drawCard(x, 66, kpiW, 66);
    ctx.fillStyle = '#6e6e73';
    ctx.font = '600 10px -apple-system, Helvetica Neue, sans-serif';
    ctx.fillText(k.label.toUpperCase(), x + 14, 86);
    ctx.fillStyle = '#1d1d1f';
    ctx.font = '700 20px -apple-system, Helvetica Neue, sans-serif';
    ctx.fillText(k.value, x + 14, 114);
    ctx.fillStyle = k.tone === 'warn' ? '#b25e00' : k.tone === 'blue' ? '#0071e3' : '#167930';
    ctx.font = '600 11px -apple-system, Helvetica Neue, sans-serif';
    ctx.fillText(k.delta, x + 125, 113);
  });

  // Card layout
  drawCard(24, 146, 780, 360, 'Global Apple Parts Flow (Suppliers → Assembly → End Markets)');
  drawCard(24, 518, 780, 278, 'Weekly Supply vs Demand Plan & Buffer (W41–W48)');
  drawCard(816, 146, 480, 200, 'Regional Sourcing Allocation');
  drawCard(816, 358, 480, 208, 'Plant & Hub Capacity Utilization');
  drawCard(816, 578, 480, 218, 'Executive Planning Brief');

  const drawSvgInto = async (svgEl, x, y, w, h) => {
    if (!svgEl) return;
    try {
      const { img } = await svgToImage(svgEl);
      ctx.drawImage(img, x, y, w, h);
    } catch {
      // Ignore individual SVG error
    }
  };

  await Promise.all([
    drawSvgInto(mapSvg, 36, 178, 756, 316),
    drawSvgInto(planSvg, 36, 550, 756, 234),
    drawSvgInto(donutSvg, 830, 176, 452, 160),
    drawSvgInto(capacitySvg, 830, 388, 452, 168),
  ]);

  // Render summary lines
  ctx.fillStyle = '#3a3a3c';
  ctx.font = '400 11px -apple-system, Helvetica Neue, sans-serif';
  const lines = String(summaryText || '').split('\n');
  let cursorY = 614;
  for (const rawLine of lines) {
    const words = rawLine.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > 448) {
        ctx.fillText(line, 830, cursorY);
        cursorY += 16;
        line = word;
      } else {
        line = test;
      }
    }
    if (line && cursorY < 784) {
      ctx.fillText(line, 830, cursorY);
      cursorY += 18;
    }
  }

  triggerDownload(canvas, `iSearch_SupplyChain_${familyLabel.replace(/\s+/g, '_')}.png`);
}
