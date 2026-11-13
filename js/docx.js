/* مولّد ملفات Word حقيقية (.docx) من فقرات بسيطة، بلا مكتبات خارجية:
   ملف ZIP غير مضغوط فيه document.xml بفقرات من اليمين لليسار. */
(function () {
  // ===== CRC32 + ZIP (تخزين بلا ضغط) =====
  const T = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; T[n] = c >>> 0; }
  const crc32 = u => { let c = 0xFFFFFFFF; for (let i = 0; i < u.length; i++) c = T[(c ^ u[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files) { // files: [{name, data: Uint8Array}]
    const enc = new TextEncoder(), parts = [], central = []; let off = 0;
    for (const f of files) {
      const nm = enc.encode(f.name), crc = crc32(f.data), sz = f.data.length;
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, 0, true); h.setUint16(12, 0x21, true); h.setUint32(14, crc, true); h.setUint32(18, sz, true); h.setUint32(22, sz, true);
      h.setUint16(26, nm.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), nm, f.data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, 0, true); c.setUint16(14, 0x21, true); c.setUint32(16, crc, true); c.setUint32(20, sz, true); c.setUint32(24, sz, true);
      c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), nm);
      off += 30 + nm.length + sz;
    }
    const csz = central.reduce((a, b) => a + b.length, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csz, true); e.setUint32(16, off, true);
    return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  const x = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  const FONT = 'Traditional Arabic';
  function run(text, o) {
    o = o || {};
    const sz = o.size || 30;
    return `<w:r><w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:cs="${FONT}"/>${o.bold ? '<w:b/><w:bCs/>' : ''}${o.color ? `<w:color w:val="${o.color}"/>` : ''}<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/><w:rtl/></w:rPr><w:t xml:space="preserve">${x(text)}</w:t></w:r>`;
  }
  /** blocks: [{ text, ref?, kind: 'title'|'h2'|'h3'|'p'|'li'|'ayah'|'hadith'|'tafsir'|'edit'|'small' }] */
  function build(blocks) {
    const ST = {
      title: { size: 40, bold: true, color: '14532D', jc: 'center', after: 240 },
      h2: { size: 34, bold: true, color: '14532D', after: 120, before: 240 },
      h3: { size: 32, bold: true, color: 'A16207', after: 100, before: 200 },
      p: { size: 30 }, li: { size: 30 }, small: { size: 22, color: '777777' },
      ayah: { size: 32, color: '14532D' }, hadith: { size: 30, color: '3B2A06' },
      tafsir: { size: 26, color: '555555' }, edit: { size: 28, color: 'B45309' },
    };
    const body = blocks.map(b => {
      const s = ST[b.kind] || ST.p;
      const pPr = `<w:pPr><w:bidi/><w:jc w:val="${s.jc || 'both'}"/><w:spacing w:before="${s.before || 0}" w:after="${s.after || 100}" w:line="380" w:lineRule="auto"/>${b.kind === 'li' ? '<w:ind w:start="360"/>' : ''}</w:pPr>`;
      return `<w:p>${pPr}${run((b.kind === 'li' ? '\u200F• ' : '') + b.text, s)}${b.ref ? run(' [' + b.ref + ']', { size: 22, color: '777777' }) : ''}</w:p>`;
    }).join('');
    const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/><w:bidi/></w:sectPr></w:body></w:document>`;
    const ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>';
    const rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';
    const enc = new TextEncoder();
    return zip([{ name: '[Content_Types].xml', data: enc.encode(ct) }, { name: '_rels/.rels', data: enc.encode(rels) }, { name: 'word/document.xml', data: enc.encode(doc) }]);
  }
  window.DOCX = { build, zip };
})();
