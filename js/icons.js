/* 🎨 أيقونات مرسومة موحّدة لكل التطبيق: تستبدل الإيموجي في القوائم والبطاقات والعناوين بأيقونات خطية بلون السمة.
   ما ليس له أيقونة مرسومة يبقى إيموجي داخل نفس الإطار الموحّد. قسم البراعم له طابع مرح خاص (بلا استبدال). */
(() => {
  const P = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
    mosque: '<path d="M4 21h16M6 21V11M18 21V11M12 3c-3 2.5-6 4.5-6 8h12c0-3.5-3-5.5-6-8z"/><path d="M12 1.5v1.5M10 21v-4a2 2 0 014 0v4"/>',
    kaaba: '<path d="M4 8l8-4 8 4v10l-8 3-8-3z"/><path d="M4 8l8 3 8-3M12 11v10M4 11.5l8 3 8-3"/>',
    books: '<path d="M4 4h4v16H4zM9 4h4v16H9z"/><path d="M14.5 5.2l3.8-1 3.9 15.6-3.8 1z"/>',
    book: '<path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z"/><path d="M12 6.5v13"/>',
    bookc: '<path d="M5 4.5A1.5 1.5 0 016.5 3H19v15H6.5A1.5 1.5 0 005 19.5z"/><path d="M5 19.5A1.5 1.5 0 006.5 21H19v-3"/><path d="M9 7h6"/>',
    scroll: '<path d="M7 4h11a2 2 0 012 2v1h-4"/><path d="M16 6v12a2 2 0 01-2 2H5a2 2 0 01-2-2v-1h11"/><path d="M7 4a2 2 0 00-2 2v11M9 9h4M9 12.5h4"/>',
    pen: '<path d="M15.5 4.5l4 4L9 19l-5 1 1-5z"/><path d="M13.5 6.5l4 4"/>',
    note: '<path d="M14 3H6a1 1 0 00-1 1v16a1 1 0 001 1h12a1 1 0 001-1V8z"/><path d="M14 3v5h5M8.5 12h7M8.5 16h5"/>',
    clip: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M8.5 10h7M8.5 14h7M8.5 18h4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    checkc: '<circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.8 2.8L16.5 9.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    scale: '<path d="M12 4v16M7 20h10M4 7h16"/><path d="M6 7l-3 6a3 3 0 006 0zM18 7l-3 6a3 3 0 006 0z"/>',
    moon: '<path d="M20 14.5A8 8 0 119.5 4a6.5 6.5 0 0010.5 10.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    sunrise: '<path d="M4 18h16M7 18a5 5 0 0110 0M12 4v5M9.5 6.5L12 4l2.5 2.5M4.5 13l1.5 1M19.5 13l-1.5 1M2 21h20"/>',
    sunset: '<path d="M4 18h16M7 18a5 5 0 0110 0M12 9V4M9.5 6.5L12 9l2.5-2.5M2 21h20"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4M8 13.5h2M14 13.5h2M8 17h2"/>',
    pin: '<path d="M6 3h12v18l-6-4-6 4z"/><path d="M9.5 8.5h5"/>',
    family: '<circle cx="8" cy="7" r="3"/><circle cx="16.5" cy="8.5" r="2.5"/><path d="M2.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6M13 20c.3-2.7 1.8-4.5 3.5-4.5S20 17.3 21 20"/>',
    user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><path d="M15.5 4.8a3.2 3.2 0 010 6.4M18 14.4c1.8.8 3 2.9 3 5.6"/>',
    child: '<circle cx="12" cy="6" r="3"/><path d="M12 9v6M8 11.5l4-1 4 1M9.5 21l2.5-6 2.5 6"/>',
    baby: '<circle cx="12" cy="12" r="8"/><path d="M9.5 11h.01M14.5 11h.01M9.5 15c1.5 1.2 3.5 1.2 5 0M12 4c-1 1.5 0 3 1.5 2.5"/>',
    flower: '<circle cx="12" cy="9" r="2.2"/><path d="M12 6.8c0-3 3.5-3 3.5-.3S12 9 12 9s-3.5-.2-3.5-2.5S12 3.8 12 6.8zM14.2 9c3 0 3 3.5.3 3.5S12 9 12 9M9.8 9c-3 0-3 3.5-.3 3.5S12 9 12 9"/><path d="M12 11.5V21M12 17c-2-2.5-5-2-5-2s.5 3 5 3"/>',
    sprout: '<path d="M12 21v-9"/><path d="M12 12C12 7 8 5 4 5c0 4 3 7 8 7zM12 14c0-4 3-6.5 7.5-6.5 0 4-3 6.5-7.5 6.5z"/><path d="M8 21h8"/>',
    leaf: '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15z"/><path d="M5 19L14 10"/>',
    tree: '<path d="M12 21v-6M12 3a6 6 0 00-5.6 8.2A4.5 4.5 0 008.5 19h7a4.5 4.5 0 002.1-7.8A6 6 0 0012 3z"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/>',
    cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>',
    broom: '<path d="M19 3l-7 7M9 9l6 6-2 6c-4-1-7-4-9-8z"/><path d="M7 15l3-3"/>',
    out: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>',
    hands: '<path d="M7 21v-4L4 12V6a1.5 1.5 0 013 0v5M17 21v-4l3-5V6a1.5 1.5 0 00-3 0v5"/><path d="M7 11l2.5 3M17 11l-2.5 3"/>',
    bell: '<path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 004 0"/>',
    belloff: '<path d="M6 16V11a6 6 0 019.5-4.9M18 11v5l1.5 2h-11M10 20.5a2 2 0 004 0M3 3l18 18"/>',
    puzzle: '<path d="M4 8h4a2 2 0 114 0h4v4a2 2 0 110 4v4h-4a2 2 0 10-4 0H4v-4a2 2 0 100-4z"/>',
    cart: '<path d="M3 4h2l2.5 11h11L21 7H6.2"/><circle cx="9" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
    beads: '<circle cx="12" cy="4.5" r="1.6"/><circle cx="17.3" cy="6.7" r="1.6"/><circle cx="19.5" cy="12" r="1.6"/><circle cx="17.3" cy="17.3" r="1.6"/><circle cx="6.7" cy="6.7" r="1.6"/><circle cx="4.5" cy="12" r="1.6"/><circle cx="6.7" cy="17.3" r="1.6"/><path d="M12 19v3"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    phones: '<path d="M4 15v-3a8 8 0 0116 0v3"/><rect x="3" y="14" width="4.5" height="6.5" rx="1.5"/><rect x="16.5" y="14" width="4.5" height="6.5" rx="1.5"/>',
    coins: '<ellipse cx="9" cy="7" rx="5.5" ry="2.5"/><path d="M3.5 7v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5V7"/><path d="M9.5 15.4c.7 1.2 3 2.1 5.5 2.1 3 0 5.5-1.1 5.5-2.5v-4c0-1.2-1.9-2.2-4.5-2.4M20.5 15v4c0 1.4-2.5 2.5-5.5 2.5S9.5 20.4 9.5 19v-3.5"/>',
    drop: '<path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z"/>',
    pill: '<rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-45 12 12)"/><path d="M9.5 9.5l5 5"/>',
    link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7L11.5 7"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1.5-1.5"/>',
    steth: '<path d="M6 3v6a5 5 0 0010 0V3"/><path d="M11 14v2a4 4 0 008 0v-1"/><circle cx="19" cy="13" r="2"/>',
    abacus: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 8h16M4 16h16"/><circle cx="8" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><path d="M8 5.5h3M14 5.5h2"/>',
    party: '<path d="M4 20l4-12 8 8z"/><path d="M14 4c0 2-1 3-3 3M20 10c-2 0-3 1-3 3M17 3l.5 1.5M21 6.5l-1.5.5"/>',
    speaker: '<path d="M4 10v4h3l5 4V6L7 10z"/><path d="M16 9a4 4 0 010 6M18.5 6.5a7.5 7.5 0 010 11"/>',
    bulb: '<path d="M9 18h6M10 21h4M8.5 14.5A6 6 0 1115.5 14.5c-.9.8-1.5 1.8-1.5 3h-4c0-1.2-.6-2.2-1.5-3z"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21M9 21h6"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 018 0v3M12 14.5v2.5"/>',
    mega: '<path d="M3 10v4h3l7 4V6L6 10z"/><path d="M16.5 9a4 4 0 010 6M19 7a7 7 0 010 10"/>',
    refresh: '<path d="M20 11a8 8 0 00-14.3-4.5L4 8M4 4v4h4M4 13a8 8 0 0014.3 4.5L20 16M20 20v-4h-4"/>',
    abc: '<path d="M4 18l4-11 4 11M5.5 14h5M14 7h3.5a2.5 2.5 0 010 5H14zm0 5h4a3 3 0 010 6h-4z"/>',
    brain: '<path d="M9 4a3 3 0 00-3 3 3 3 0 00-2 5 3 3 0 002 5 3 3 0 006 1V5a2 2 0 00-3-1zM15 4a3 3 0 013 3 3 3 0 012 5 3 3 0 01-2 5 3 3 0 01-6 1"/>',
    question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-1 .7-1.5 1.3-1.5 2.5M12 17h.01"/>',
    muscle: '<path d="M7 20c-2-2-3-6-1-10l3-5 3 1-2 4 2 1c2-1 5-1 7 1 2 3 1 7-3 8z"/>',
    shake: '<path d="M3 12l4-4 4 2 3-2 7 5-4 4-2-1-2 2-4-3z"/><path d="M11 10l-3 3a1.5 1.5 0 002 2l3-2"/>',
    pot: '<path d="M4 10h16v3a7 7 0 01-7 7h-2a7 7 0 01-7-7zM2 10h20M9 6c0-1 1-1 1-2M14 6c0-1 1-1 1-2"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
    chartup: '<path d="M3 20h18M4 16l5-5 4 3 7-8"/><path d="M15 6h5v5"/>',
    down: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>',
    up: '<path d="M12 20V8M7 13l5-5 5 5M5 4h14"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    alarm: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.5 1.5M4 4.5L6.5 2.5M20 4.5L17.5 2.5"/>',
    hourglass: '<path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/>',
    doc: '<path d="M14 3H6a1 1 0 00-1 1v16a1 1 0 001 1h12a1 1 0 001-1V8z"/><path d="M14 3v5h5"/>',
    inbox: '<path d="M3 13l3-8h12l3 8v6a1 1 0 01-1 1H4a1 1 0 01-1-1z"/><path d="M3 13h5a4 4 0 008 0h5M12 3v7M9 7l3 3 3-3"/>',
    outbox: '<path d="M3 13l3-8h3M15 5h3l3 8v6a1 1 0 01-1 1H4a1 1 0 01-1-1z"/><path d="M3 13h5a4 4 0 008 0h5M12 11V3M9 6l3-3 3 3"/>',
    crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
    gift: '<rect x="3.5" y="9" width="17" height="4" rx="1"/><path d="M5 13v8h14v-8M12 9v12M12 9c-1-4-6-5-6-2s6 2 6 2zM12 9c1-4 6-5 6-2s-6 2-6 2z"/>',
    mic2: '<circle cx="9" cy="9" r="5"/><path d="M12.5 12.5L20 21M7 7l4 4"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    case: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M3 13h18"/>',
    columns: '<path d="M3 21h18M4 18h16M5 9h14M12 3L4 7.5h16z"/><path d="M7 9v9M12 9v9M17 9v9"/>',
    hist: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2M3 12h2"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 007 0M9 9.5h.01M15 9.5h.01"/>',
    receipt: '<path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    run: '<circle cx="14" cy="4.5" r="2"/><path d="M6 21l3.5-6 3 2.5V21M8 11l3-3 3 3 3 1M11 8l1.5 6.5"/>',
    ring: '<circle cx="12" cy="15" r="6"/><path d="M9 4h6l-1.5 3.5h-3z"/>',
    tools: '<path d="M14.5 6.5a4 4 0 005 5l-8 8a2.1 2.1 0 01-3-3l8-8a4 4 0 00-2-2z"/><path d="M5 3l3 3-1 2-2 1-3-3"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
    feather: '<path d="M20 4c-8 0-14 5-14 13v3M6 17l7-7M9 14h6c3-2 5-6 5-10"/>',
    idcard: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="11" r="2"/><path d="M5.5 16c.5-1.5 1.6-2.3 3-2.3s2.5.8 3 2.3M14 10h4M14 13.5h3"/>',
    back: '<path d="M9 14l-4-4 4-4"/><path d="M5 10h10a5 5 0 010 10h-3"/>',
    fire: '<path d="M12 21a7 7 0 007-7c0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8a7 7 0 007 7z"/>',
    car: '<path d="M4 16v-4l2-5h12l2 5v4z"/><path d="M4 16v2.5M20 16v2.5M4 12h16"/><circle cx="7.5" cy="14" r=".6"/><circle cx="16.5" cy="14" r=".6"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z"/>',
    syringe: '<path d="M18 3l3 3M19.5 4.5l-4 4M16 5l3 3-10 10H6v-3zM8.5 12.5l2 2M11 10l2 2"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
    map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
    pray: '<circle cx="12" cy="5" r="2"/><path d="M12 8v6l-4 2v4M12 14l4 2v4M8.5 10.5L12 12l3.5-1.5"/>',
    palette: '<path d="M12 3a9 9 0 000 18c1.5 0 2-1 2-2s-1-1.5-1-2.5S14 15 15 15h2a4 4 0 004-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
    trophy: '<path d="M7 4h10v5a5 5 0 01-10 0zM7 6H4v2a3 3 0 003 3M17 6h3v2a3 3 0 01-3 3M12 14v4M8 21h8M9.5 18h5"/>',
    microscope: '<path d="M6 21h12M9 17h6M12 17a5 5 0 005-5M10 4l4 2-3 6-4-2zM12 3l1 .5"/>',
    ladder: '<path d="M7 3v18M17 3v18M7 7h10M7 12h10M7 17h10"/>',
    bubble: '<path d="M12 4c5 0 9 3 9 7s-4 7-9 7c-1 0-2 0-3-.3L4 20l1.5-4C4 14.7 3 13 3 11c0-4 4-7 9-7z"/>',
    folder: '<path d="M3 6a1 1 0 011-1h5l2 2h9a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1z"/>',
    box: '<path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5l9 4.5 9-4.5M12 12v9"/>',
    camel: '<path d="M3 20v-6c0-2 1-3 2-3l2-3c1-1 2 0 2 1l1 2 2-3c1-1 2 0 2 1l1 3h2V8l2-1 2 1-1 2v5l-1 5M7 20v-4M15 20v-4"/>',
    dove: '<path d="M3 13c3 0 5-2 6-5 1 3 3 4 6 4l6-4-2 5c-1 4-4 6-8 6-4 0-6-2-8-6z"/><path d="M15 12c0-3 1-6 3-8"/>',
    water: '<path d="M2 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0M12 3s3 3.5 3 6a3 3 0 01-6 0c0-2.5 3-6 3-6z"/>',
    mountain: '<path d="M2 20l7-12 4 6 3-4 6 10z"/><path d="M7.5 11l1.5 1 1.5-1"/>',
    wind: '<path d="M3 8h11a3 3 0 10-3-3M3 12h16a3 3 0 11-3 3M3 16h8"/>',
    feet: '<path d="M8 21c-2 0-3-1.5-3-4s1-5 3-5 3 2 3 4.5S10 21 8 21zM16 14c-2 0-3-1.5-3-4s1-5 3-5 3 2 3 4.5-1 4.5-3 4.5z"/>',
    timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.5M10 2.5h4M18.5 6.5l1.5-1.5"/>',
    bottle: '<path d="M10 2h4v3l2 3v12a2 2 0 01-2 2h-4a2 2 0 01-2-2V8l2-3z"/><path d="M8 12h8M8 16h8"/>',
    bag: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 016 0v2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
    warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
    tv: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M8 2.5l4 3.5 4-3.5"/>',
    bed: '<path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 00-3-3h-8v6M6.5 12a1.5 1.5 0 100-.01"/>',
    tooth: '<path d="M7 3c-3 0-4 3-3 6 1 2 1 4 2 8 .5 2 2.5 2 3 0l1-4h4l1 4c.5 2 2.5 2 3 0 1-4 1-6 2-8 1-3 0-6-3-6-2 0-3 1-5 1S9 3 7 3z"/>',
    thermo: '<path d="M10 14V5a2 2 0 014 0v9a4 4 0 11-4 0z"/><path d="M12 9v7"/>',
    aid: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M12 10.5v6M9 13.5h6"/>',
    phone2: '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
    bulbon: '<path d="M9 18h6M10 21h4M8.5 14.5A6 6 0 1115.5 14.5c-.9.8-1.5 1.8-1.5 3h-4c0-1.2-.6-2.2-1.5-3z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
    hijri: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M14.5 13a3 3 0 10.5 4.5 2.5 2.5 0 01-.5-4.5z"/>',
  };
  const M = {
    '🏠': 'home', '🏡': 'home', '🕌': 'mosque', '🕋': 'kaaba', '📚': 'books', '📖': 'book', '📘': 'bookc', '📗': 'bookc', '📕': 'bookc', '📜': 'scroll', '✍': 'pen', '✏': 'pen', '🖋': 'pen', '🖍': 'pen', '✎': 'pen',
    '📝': 'note', '📋': 'clip', '✔': 'check', '✓': 'check', '✅': 'checkc', '➕': 'plus', '🧭': 'compass', '⚖': 'scale', '🌙': 'moon', '☀': 'sun', '🌅': 'sunrise', '🌇': 'sunset', '🌤': 'sun',
    '⭐': 'star', '🌟': 'star', '★': 'star', '✨': 'sparkle', '📅': 'cal', '📆': 'cal', '📌': 'pin', '📍': 'pin', '👨‍👩‍👧': 'family', '👨‍👩‍👧‍👦': 'family', '👪': 'family', '👥': 'users', '👫': 'users', '👨‍👧': 'family',
    '👤': 'user', '🙂': 'smile', '🧒': 'child', '👧': 'child', '👦': 'child', '🧑': 'user', '👨': 'user', '👩': 'user', '👶': 'baby', '🍼': 'bottle', '🌸': 'flower', '🌷': 'flower', '🌼': 'flower', '🪷': 'flower',
    '🌱': 'sprout', '🪴': 'sprout', '🌿': 'leaf', '🌳': 'tree', '🌴': 'tree', '🤍': 'heart', '❤': 'heart', '💛': 'heart', '🎓': 'cap', '🔎': 'search', '🔍': 'search', '🧹': 'broom', '↗': 'out', '🤲': 'hands',
    '🔔': 'bell', '🔕': 'belloff', '🧩': 'puzzle', '🛒': 'cart', '🗑': 'trash', '📿': 'beads', '🛡': 'shield', '🎧': 'phones', '💰': 'coins', '💵': 'coins', '🩸': 'drop', '💧': 'drop', '💊': 'pill',
    '🔗': 'link', '🩺': 'steth', '🧮': 'abacus', '🎉': 'party', '🔊': 'speaker', '💡': 'bulb', '🎙': 'mic', '🎤': 'mic', '🔒': 'lock', '🔐': 'lock', '📣': 'mega', '🔄': 'refresh', '🔁': 'refresh', '🔤': 'abc',
    '🧠': 'brain', '❓': 'question', '❔': 'question', '💪': 'muscle', '🤝': 'shake', '🍲': 'pot', '🍽': 'pot', '📊': 'chart', '📈': 'chartup', '⬇': 'down', '📥': 'inbox', '📤': 'outbox', '⬆': 'up', '⏰': 'alarm',
    '⏳': 'hourglass', '⏱': 'timer', '📄': 'doc', '🧾': 'receipt', '👑': 'crown', '🎁': 'gift', '⚙': 'gear', '🛠': 'tools', '🧰': 'tools', '💼': 'case', '🏛': 'columns', '🕰': 'hist', '☰': 'menu',
    '🏃': 'run', '🏃‍♀️': 'run', '💍': 'ring', '🎼': 'music', '🎵': 'music', '🪶': 'feather', '🪪': 'idcard', '↩': 'back', '🔥': 'fire', '🚗': 'car', '🚙': 'car', '📞': 'phone', '💉': 'syringe', '💬': 'chat', '🗣': 'chat', '💭': 'bubble',
    '🗺': 'map', '🧎': 'pray', '🎨': 'palette', '🏆': 'trophy', '🔬': 'microscope', '🪜': 'ladder', '📁': 'folder', '📦': 'box', '🐪': 'camel', '🕊': 'dove', '🌊': 'water', '⛰': 'mountain', '🌬': 'wind', '👣': 'feet',
    'ℹ': 'info', '💾': 'save', '⚠': 'warn', '📻': 'speaker', '🛏': 'bed', '🦷': 'tooth', '🌡': 'thermo', '🩹': 'aid', '🏥': 'aid', '🚑': 'aid', '📱': 'phone2', '🎯': 'target', '🤰': 'user', '🤱': 'baby', '🧘': 'user',
    '🎒': 'bag', '🧺': 'bag', '📬': 'inbox', '🪑': 'users', '👕': 'bag', '🧽': 'broom', '🎤️': 'mic',
  };
  // ألوان متناسقة من عائلة واحدة: لكل نوع لون
  const HUE = { quran: '#0f7a55', day: '#b7791f', family: '#a3375c', ilm: '#2f56a0', health: '#0f8088', money: '#8a5a2b', kids: '#d4681e', admin: '#5b6578' };
  const CAT = {
    quran: 'book bookc kaaba phones speaker mic note', day: 'sun sunrise sunset moon beads hands mosque cal alarm clock hijri star sparkle bell belloff timer hourglass pray dove',
    family: 'home family users user heart flower baby child ring shake gift smile chat bubble crown', ilm: 'books cap scale scroll puzzle link columns hist abc brain question search feather mega idcard map camel target microscope ladder',
    health: 'steth pill drop syringe aid thermo tooth run muscle leaf sprout tree water mountain wind feet bed bottle lock shield', money: 'coins abacus case cart receipt chart chartup tools gear box bag trophy',
  };
  const K2C = {}; for (const [c, ks] of Object.entries(CAT)) ks.split(' ').forEach(k => K2C[k] = c);
  const SEC = { family: 'family', day: 'day', quran: 'quran', kids: 'kids', sunnah: 'ilm', admin: 'admin' };
  const hueFor = (el, k) => { const d = el.closest('.nav-sec'); if (d && SEC[d.dataset.sec]) return HUE[SEC[d.dataset.sec]]; return HUE[K2C[k]] || HUE.quran; };
  const norm = s => s.replace(/[️‍\u{1F3FB}-\u{1F3FF}]/gu, m => m === '‍' ? m : '').trim();
  const keyOf = t => { t = (t || '').trim(); if (!t) return null; return M[t] || M[norm(t)] || M[norm(t).replace(/‍.*/u, '')] || null; };
  const svg = k => `<svg class="zsv" viewBox="0 0 24 24" aria-hidden="true">${P[k]}</svg>`;
  const EMO = /^(\p{Extended_Pictographic}|[☰✓✔✎★ℹ↗↩])[️‍\p{Extended_Pictographic}\p{Emoji_Modifier}♀♂]*/u;
  const BOX = '.ni, .ti, .tile > .ic, .quick .ic, .fam-ic, .card > .ic, .bt-ic, .us-ic, .tk-ic';
  const HEAD = '#view h1, #view h2, #view h3, .sec-head, #view .fam-h, #view summary, .sec-grp > summary, #view .row > b:first-child, #modal h3';
  const BTN = '.btn, .icon-btn, .global-search button, #notesFab, .pill, .tabs > button, .tabs > a, .lib-tabs > button, .chip';
  const skip = el => document.body.classList.contains('learn-kids') || el.closest('.sp2, .lr-wrap, .no-zi, .kids, [contenteditable]');

  function boxes(root) {
    root.querySelectorAll(BOX).forEach(el => {
      if (el.dataset.zi || skip(el)) return; el.dataset.zi = 1;
      if (el.querySelector('svg, img, .abc-ic')) { el.classList.add('zi'); el.style.setProperty('--hue', hueFor(el, 'abc')); return; }
      const t = el.textContent.trim(), m = t.match(EMO); if (!m || m[0].length !== t.length) return;
      const k = keyOf(t); el.classList.add('zi'); el.style.setProperty('--hue', hueFor(el, k)); if (k) { el.innerHTML = svg(k); el.dataset.k = k; } else el.classList.add('zi-emo');
    });
  }
  function heads(root) {
    root.querySelectorAll(HEAD).forEach(h => {
      if (h.dataset.zh || skip(h)) return; h.dataset.zh = 1;
      const tn = [...h.childNodes].find(n => n.nodeType === 3 ? n.textContent.trim() : true); if (!tn || tn.nodeType !== 3) return;
      const s = tn.textContent.replace(/^\s+/, ''), m = s.match(EMO); if (!m) return;
      const k = keyOf(m[0]); const sp = document.createElement('span'); sp.className = 'zh' + (k ? '' : ' zh-emo'); sp.innerHTML = k ? svg(k) : m[0]; if (k) { sp.dataset.k = k; sp.style.setProperty('--hue', hueFor(h, k)); }
      tn.textContent = s.slice(m[0].length).replace(/^\s*/, ''); h.insertBefore(sp, tn);
    });
  }
  // الأزرار: الإيموجي في أولها يصير أيقونة خطية بلون الزر
  function btns(root) {
    root.querySelectorAll(BTN).forEach(b => {
      if (b.dataset.zb || skip(b)) return; b.dataset.zb = 1;
      const tn = [...b.childNodes].find(n => n.nodeType === 3 ? n.textContent.trim() : true); if (!tn || tn.nodeType !== 3) return;
      const s = tn.textContent.replace(/^\s+/, ''), m = s.match(EMO); if (!m) return; const k = keyOf(m[0]); if (!k) return;
      const sp = document.createElement('span'); sp.className = 'zb'; sp.innerHTML = svg(k);
      tn.textContent = s.slice(m[0].length).replace(/^\s*/, s.length > m[0].length ? ' ' : ''); b.insertBefore(sp, tn); if (!tn.textContent.trim()) b.classList.add('zb-only');
    });
  }
  const apply = root => { if (!root || !root.querySelectorAll) return; boxes(root); heads(root); btns(root); if (root.matches) { if (root.matches(BOX)) boxes(root.parentNode || root); } };
  let q = new Set(), raf = 0;
  const flush = () => { raf = 0; const items = [...q]; q.clear(); items.forEach(n => n.isConnected && apply(n.parentNode || n)); };
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) q.add(n); if (q.size && !raf) raf = requestAnimationFrame(flush); }).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => apply(document.body));
  if (document.body) apply(document.body);
  window.ZICONS = { svg, keyOf, apply, has: k => !!P[k] };

  // حركة صغيرة عند الضغط تناسب الأيقونة (الجرس يرن، النجمة تلمع، الكتاب ينفتح…)
  document.addEventListener('pointerdown', e => {
    const host = e.target.closest && e.target.closest('a, button, .tile, .fam-tile, summary'); if (!host) return;
    const z = host.querySelector('.zi[data-k], .zb, .zh[data-k]'); if (!z) return;
    z.classList.remove('z-tap'); void z.offsetWidth; z.classList.add('z-tap'); setTimeout(() => z.classList.remove('z-tap'), 800);
  }, { passive: true });

  // 🌙 لمسة المواسم: فوانيس في رمضان، ونجوم في العيدين (على شاشة البداية)
  window.ZICONS.season = () => {
    try { const f = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { month: 'numeric', day: 'numeric' }).formatToParts(new Date()); const m = +f.find(x => x.type === 'month').value, d = +f.find(x => x.type === 'day').value;
      if (m === 9) return 'ramadan'; if ((m === 10 && d <= 3) || (m === 12 && d >= 9 && d <= 13)) return 'eid'; } catch (e) { }
    return '';
  };

  // 🎈 أصوات مرحة لقسم البراعم (تُولَّد على الجهاز بلا ملفات)
  let ctx = null;
  const sfxOn = () => { try { return localStorage.getItem('kid-sfx') !== '0'; } catch (e) { return true; } };
  function boop(kind) {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume();
      const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination);
      const R = [[520, 980, 'sine', .14], [380, 760, 'triangle', .16], [660, 1320, 'sine', .1], [300, 900, 'sine', .18]][kind != null ? kind : (Math.random() * 4 | 0)];
      o.type = R[2]; o.frequency.setValueAtTime(R[0], t); o.frequency.exponentialRampToValueAtTime(R[1], t + R[3] * .6);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(.22, t + .015); g.gain.exponentialRampToValueAtTime(0.0001, t + R[3]);
      o.start(t); o.stop(t + R[3] + .02);
    } catch (e) { }
  }
  window.ZICONS.boop = boop;
  document.addEventListener('pointerdown', e => {
    if (!document.body.classList.contains('learn-kids') || !sfxOn()) return;
    const t = e.target.closest && e.target.closest('a, button, .lr-tile, .lr-opt, .lr-btn, [role=button]'); if (!t) return;
    boop(); t.classList.remove('kd-jelly'); void t.offsetWidth; t.classList.add('kd-jelly'); setTimeout(() => t.classList.remove('kd-jelly'), 600);
  }, { passive: true });
})();
