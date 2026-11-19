(() => {
  "use strict";
  if (document.getElementById("huit-helper")) return;
  const STORE = "huit-helper-v1";
  const normalize = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/\s+/g, " ").trim();
  const cells = row => [...row.cells].map(cell => cell.textContent.trim());
  const headers = table => {
    const row = [...table.rows].find(item => item.querySelector("th"));
    return row || table.rows[0];
  };
  function findTable(terms) {
    return [...document.querySelectorAll("table")].find(table => {
      const text = normalize(headers(table)?.textContent);
      return terms.every(term => text.includes(term));
    });
  }
  function records(table) {
    if (!table) return [];
    const head = headers(table);
    return [...table.rows].filter(row => row !== head && row.cells.length >= head.cells.length && row.cells.length > 1 && !row.querySelector("th"));
  }
  function courseRows() { return records(findTable(["ten mon hoc", "ma hp"])); }
  function classTable() { return findTable(["si so", "da dang ky", "ma lhp"]); }
  function column(table, term) {
    return [...headers(table).cells].findIndex(cell => normalize(cell.textContent).includes(term));
  }
  function number(value) {
    return /^\s*\d+\s*$/.test(value ?? "") ? Number(value) : null;
  }

  function parsePlan(text) {
    const seen = new Set();
    return text.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map((line,index) => {
      const parts = line.split(/[,\s;|]+/);
      if (parts.length < 2 || parts.length > 3 || !/^\d+$/.test(parts[0]) || !/^\d+$/.test(parts[1])) {
        throw new Error("Dòng " + (index+1) + ": nhập Mã HP, Mã LHP và nhóm thực hành (nếu có).");
      }
      if (seen.has(parts[0])) throw new Error("Mỗi môn chỉ nhập một lớp. Trùng Mã HP " + parts[0]);
      seen.add(parts[0]);
      return {hp:parts[0],lhp:parts[1],group:parts[2] || "",result:"waiting"};
    });
  }
  function registeredCodes(table) {
    if (!table) return [];
    const index = column(table,"ma lhp");
    return records(table).map(row => cells(row)[index]).filter(Boolean);
  }

  const host = document.createElement("div");
  host.id = "huit-helper";
  document.documentElement.append(host);
  const root = host.attachShadow({mode:"open"});
  root.innerHTML = '<style>' +
    ':host{all:initial;font:14px system-ui,sans-serif;color:#172b41}*{box-sizing:border-box}button,input,textarea{font:inherit}textarea{width:100%;border:1px solid #bccbd9;border-radius:6px;padding:8px}button{cursor:pointer;border:1px solid #ced8e3;border-radius:7px;padding:7px 10px;background:white;color:#163b60}button.primary{background:#075db5;color:white;border-color:#075db5}button:disabled{opacity:.5;cursor:default}#panel{position:fixed;right:14px;top:65px;width:420px;max-width:calc(100vw - 28px);max-height:85vh;overflow:auto;z-index:2147483646;background:#fff;border:1px solid #b8cadd;border-radius:12px;box-shadow:0 8px 36px #17395438}header{display:flex;align-items:center;justify-content:space-between;padding:14px;background:#eef6ff}h2{font-size:16px;margin:0}.body{padding:14px}.row{display:flex;gap:8px;align-items:center;margin:10px 0;flex-wrap:wrap}label{display:block;margin:10px 0}input{border:1px solid #bccbd9;border-radius:6px;padding:7px;max-width:100%}input[type=search]{width:100%}input[type=number]{width:65px}input[type=datetime-local]{width:100%}p{line-height:1.5;margin:8px 0}.muted{color:#5f7183;font-size:12px}#status{background:#f0f5fa;border-radius:6px;padding:9px;white-space:pre-line}article{border-top:1px solid #e2e9f0;padding:10px 0}strong{display:block}small{display:block;color:#5f7183;margin:4px 0}.capacity{font-weight:600;color:#086245}.full{color:#b33232}#launcher{position:fixed;right:14px;top:14px;z-index:2147483647;background:#075db5;color:white}details{margin-top:12px}summary{cursor:pointer}</style>' +
    '<button id="launcher">HUIT • Công cụ</button><section id="panel"><header><h2>Đăng ký học phần HUIT</h2><button id="hide" aria-label="Thu gọn">−</button></header><div class="body">' +
    '<p class="muted">Đăng nhập trên HUIT và chọn đúng đợt trước khi bắt đầu.</p><label>Giờ bắt đầu (giờ trên máy bạn)<input id="start" type="datetime-local"></label>' +
    '<label>Chờ giữa các lượt cập nhật <input id="interval" type="number" min="1" max="300" value="1"> giây</label>' +
    '<div class="row"><button id="watch" class="primary">Bắt đầu theo dõi</button><button id="stop">Dừng</button><button id="scan">Lấy môn và lớp</button></div>' +
    '<details open><summary>Đăng ký tự động theo mã</summary><p class="muted">Mỗi dòng: Mã HP, Mã LHP, nhóm thực hành (nếu có). Giữ nguyên số 0 đầu mã.</p><textarea id="plan" rows="4" aria-label="Danh sách Mã HP và Mã LHP" placeholder="MA_HP, MA_LHP\nMA_HP, MA_LHP, NHOM_TH"></textarea><div class="row"><button id="savePlan">Lưu danh sách</button><button id="arm" class="primary">Bật tự đăng ký</button></div><p class="muted">Bật tự đăng ký sẽ cho phép công cụ bấm Đăng ký môn học cho các mã đã lưu, theo giờ bắt đầu và đúng đợt đang chọn. Dừng sẽ ngắt cả theo dõi và đăng ký tự động.</p><p id="planStatus" style="white-space:pre-line" role="status"></p></details>' +
    '<p id="status" role="status" aria-live="polite"></p><p id="context" class="muted"></p>' +
    '<input id="search" type="search" aria-label="Tìm môn hoặc mã lớp" placeholder="Tìm môn hoặc mã lớp">' +
    '<label><input id="savedOnly" type="checkbox"> Chỉ hiện lớp đã đánh dấu</label><div id="results"></div>' +
    '<details><summary>Cách hoạt động</summary><p class="muted">Chờ đến giờ đã đặt, tải lại trang khi chưa có môn. Khi có môn, công cụ lần lượt chọn từng môn và đọc bảng lớp. Bạn có thể dừng bất kỳ lúc nào. Nút “Mở lớp” đưa bạn về lớp trên trang HUIT để xem lịch, chọn nhóm thực hành và bấm đăng ký.</p><p class="muted">Sĩ số là bản ghi tại thời điểm đọc. Tab nền hoặc máy ngủ có thể làm chậm cập nhật. Dữ liệu môn và lớp được lưu cục bộ trong trình duyệt.</p></details></div></section>';
  const $ = id => root.getElementById(id);
  let state = {start:"2026-11-30T08:30", interval:1, watching:false, selected:[], courses:[], context:"", plan:[], planText:"", auto:false, autoContext:""};
  let stopped = false;
  let busy = false;
  let timer;
  let epoch = 0;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const persist = () => chrome.storage.local.set({[STORE]:state});
  const status = message => { $("status").textContent = message; };
  function context() {
    const select = [...document.querySelectorAll("select")].find(el => /HK|học kỳ|hoc ky/i.test(el.textContent));
    const radio = [...document.querySelectorAll('input[type="radio"]:checked')].find(el => !el.closest("table"));
    const label = radio && (radio.labels?.[0]?.textContent || radio.nextSibling?.textContent);
    return [select?.selectedOptions[0]?.textContent.trim(), label?.trim()].filter(Boolean).join(" • ");
  }
  function courseKey(row) {
    const table = row.closest("table");
    const values = cells(row);
    return values[column(table,"ma hp")] || values.join("|");
  }
  function courseName(row) {
    return cells(row)[column(row.closest("table"),"ten mon hoc")] || courseKey(row);
  }
  function clickRow(row) {
    const control = row.querySelector('input[type="radio"], input[type="checkbox"], a, button, [onclick]');
    (control || row.cells[0] || row).click();
  }
  // shortcut: DOM tables are inferred from visible headers; verify against HUIT when the registration period opens.
  async function loadClasses(row, token) {
    const previous = classTable();
    let changed = false;
    const observer = new MutationObserver(() => { changed = true; });
    observer.observe(previous || document.body, {subtree:true,childList:true,characterData:true});
    try {
      clickRow(row);
      const deadline = Date.now() + 10000;
      while (Date.now() < deadline && !stopped && token === epoch) {
        await sleep(200);
        const current = classTable();
        if (changed || current !== previous) {
          await sleep(700);
          if (stopped || token !== epoch) return null;
          const table = classTable();
          if (!table) return null;
          const code = column(table,"ma lhp");
          const name = column(table,"ten lop");
          const max = column(table,"si so");
          const enrolled = column(table,"da dang ky");
          const result = records(table).map(item => {
            const values = cells(item);
            return {code:values[code],name:values[name] || "",max:number(values[max]),enrolled:number(values[enrolled]),readAt:Date.now()};
          }).filter(item => item.code);
          return result;
        }
      }
      return null;
    } finally { observer.disconnect(); }
  }
  function render() {
    $("context").textContent = state.context ? "Đợt dữ liệu • " + state.context : "";
    const query = normalize($("search").value);
    const container = $("results");
    container.replaceChildren();
    for (const course of state.courses) {
      const matching = course.classes.filter(item => {
        const key = course.key + "|" + item.code;
        return (!$("savedOnly").checked || state.selected.includes(key)) && normalize(course.name + " " + item.code + " " + item.name).includes(query);
      });
      if (!matching.length && (query || $("savedOnly").checked || course.classes.length)) continue;
      const article = document.createElement("article");
      const title = document.createElement("strong");
      title.textContent = course.name;
      article.append(title);
      if (!course.classes.length) {
        const note = document.createElement("small");
        note.textContent = course.error || "Cổng trả bảng lớp trống.";
        article.append(note);
      }
      for (const item of matching) {
        const key = course.key + "|" + item.code;
        const label = document.createElement("label");
        const check = document.createElement("input");
        check.type = "checkbox";
        check.checked = state.selected.includes(key);
        check.onchange = () => {
          state.selected = check.checked ? [...new Set([...state.selected,key])] : state.selected.filter(value => value !== key);
          persist();
          render();
        };
        label.append(check, document.createTextNode(" " + item.code + " • " + item.name));
        const capacity = document.createElement("span");
        capacity.className = "capacity";
        const remaining = item.max !== null && item.enrolled !== null ? Math.max(0,item.max-item.enrolled) : null;
        capacity.textContent = remaining === null ? "Sĩ số chưa xác định" : item.enrolled + "/" + item.max + " • Còn " + remaining + " chỗ";
        if (remaining === 0) capacity.classList.add("full");
        const time = document.createElement("small");
        time.textContent = "Đọc lúc " + new Date(item.readAt).toLocaleString("vi-VN");
        const open = document.createElement("button");
        open.textContent = "Mở lớp";
        open.disabled = busy;
        open.onclick = () => openClass(course.key,item.code);
        article.append(label,capacity,time,open);
      }
      container.append(article);
    }
    if (!container.children.length) container.textContent = "Chưa có dữ liệu phù hợp.";
  }
  function halt() {
    stopped = true;
    epoch++;
    state.watching = false;
    state.auto = false;
    clearTimeout(timer);
    persist();
  }
  async function scan() {
    if (busy) return;
    const rows = courseRows();
    if (!rows.length) { status("Chưa có môn. Kiểm tra đợt đăng ký và quyền đăng ký trên HUIT."); return; }
    busy = true;
    stopped = false;
    const token = ++epoch;
    $("scan").disabled = true;
    const currentContext = context();
    if (state.context !== currentContext) state.courses = [];
    state.context = currentContext;
    render();
    let failures = 0;
    try {
      const keys = rows.map(courseKey);
      for (let i = 0; i < keys.length && !stopped && token === epoch; i++) {
        const row = courseRows().find(item => courseKey(item) === keys[i]);
        if (!row) { failures++; continue; }
        status("Đang lấy " + (i+1) + "/" + keys.length + " • " + courseName(row));
        const name = courseName(row);
        const classes = await loadClasses(row,token);
        if (stopped || token !== epoch) break;
        const old = state.courses.find(item => item.key === keys[i]);
        const record = {key:keys[i],name,classes:classes ?? old?.classes ?? [],error:classes === null ? "Chưa xác nhận được phản hồi từ HUIT. Thử chọn môn trên trang rồi lấy lại." : ""};
        if (classes === null) failures++;
        state.courses = [...state.courses.filter(item => item.key !== keys[i]),record];
        await persist();
        render();
      }
      status(stopped ? "Đã dừng. Dữ liệu đã đọc được giữ lại." : "Đã đọc danh sách. " + (failures ? failures + " môn chưa xác nhận được phản hồi. " : "") + "Chọn Mở lớp để xem lịch và đăng ký trên HUIT.");
    } catch (error) {
      status("Lỗi khi đọc trang: " + error.message);
    } finally {
      busy = false;
      $("scan").disabled = false;
      render();
    }
  }
  async function openClass(key,code) {
    halt();
    if (busy) { status("Đang dừng lượt đọc. Bấm Mở lớp lại khi lượt đọc kết thúc."); return; }
    if (context() !== state.context) { status("Dữ liệu thuộc đợt khác. Chọn đúng đợt và lấy lại danh sách."); return; }
    const row = courseRows().find(item => courseKey(item) === key);
    if (!row) { status("Không tìm thấy môn trong đợt hiện tại. Hãy lấy lại danh sách."); return; }
    busy = true;
    stopped = false;
    const token = ++epoch;
    render();
    try {
      const classes = await loadClasses(row,token);
      if (classes === null) { status("Chưa xác nhận được bảng lớp. Hãy chọn môn trực tiếp trên trang HUIT."); return; }
      const table = classTable();
      const index = column(table,"ma lhp");
      const target = records(table).find(item => cells(item)[index] === code);
      if (!target) { status("Lớp không còn trong bảng hiện tại."); return; }
      clickRow(target);
      target.scrollIntoView({behavior:"smooth",block:"center"});
      status("Đã mở lớp " + code + ". Kiểm tra lịch, nhóm thực hành và bấm Đăng ký môn học trên HUIT.");
    } catch (error) { status("Không mở được lớp: " + error.message); }
    finally { busy = false; render(); }
  }

  async function selectClassForRegistration(row,token) {
    const detail = findTable(["lich hoc","giang vien"]);
    if (!detail) return false;
    let updated = false;
    const observer = new MutationObserver(() => { updated = true; });
    observer.observe(detail.parentElement,{childList:true,subtree:true,characterData:true});
    try {
      clickRow(row);
      const deadline = Date.now() + 10000;
      while (!updated && Date.now() < deadline && !stopped && token === epoch) await sleep(200);
      if (!updated || stopped || token !== epoch) return false;
      await sleep(700);
      return !stopped && token === epoch;
    } finally { observer.disconnect(); }
  }

  function registeredTable() { return findTable(["ma lhp","hoc phi","ngay dk"]); }
  function isRegistered(code) { return registeredCodes(registeredTable()).includes(code); }
  function registrationButton() {
    return [...document.querySelectorAll('button,input[type="button"],input[type="submit"],a')].find(el =>
      normalize(el.textContent || el.value) === "dang ky mon hoc");
  }
  function renderPlan() {
    $("planStatus").textContent = (state.plan || []).map(item =>
      item.hp + " → " + item.lhp + " • " + ({
        waiting:"Chờ xử lý", full:"Đang đầy", missing:"Chưa thấy môn/lớp",
        done:"Đã xác nhận đăng ký", pending:"Đã gửi, cần kiểm tra kết quả"
      }[item.result] || item.result)
    ).join("\n");
  }
  async function autoRegister() {
    if (busy) return;
    if (context() !== state.autoContext) {
      halt();
      status("Đợt hoặc hình thức học đã đổi. Kiểm tra và bật đăng ký tự động lại.");
      return;
    }
    busy = true;
    stopped = false;
    const token = ++epoch;
    $("scan").disabled = true;
    render();
    try {
      for (const item of state.plan) {
        if (stopped || token !== epoch) break;
        if (isRegistered(item.lhp)) {
          item.result = "done";
          await persist();
          renderPlan();
          continue;
        }
        if (item.result === "done") continue;
        if (item.result === "pending") {
          halt();
          status("Lớp " + item.lhp + " đã được gửi nhưng chưa xác nhận. Kiểm tra bảng đã đăng ký, tải lại trang rồi bật lại. Muốn gửi lại, nhập và lưu lại danh sách sau khi xác nhận chưa đăng ký.");
          break;
        }
        const row = courseRows().find(row => courseKey(row) === item.hp);
        if (!row) { item.result = "missing"; continue; }
        status("Tự đăng ký • " + item.hp + " → " + item.lhp);
        const classes = await loadClasses(row,token);
        if (stopped || token !== epoch) break;
        if (classes === null) {
          halt();
          status("Chưa xác nhận được bảng lớp của " + item.hp + ". Kiểm tra trang HUIT rồi bật lại.");
          break;
        }
        const target = classes.find(entry => entry.code === item.lhp);
        if (!target) { item.result = "missing"; continue; }
        if (target.max === null || target.enrolled === null) {
          halt();
          status("Chưa đọc được sĩ số lớp " + item.lhp + ". Kiểm tra trên HUIT.");
          break;
        }
        if (target.enrolled >= target.max) { item.result = "full"; continue; }
        const table = classTable();
        const codeIndex = column(table,"ma lhp");
        const classRow = records(table).find(entry => cells(entry)[codeIndex] === item.lhp);
        if (!classRow) throw new Error("Bảng lớp vừa thay đổi. Bật lại để đọc lại dữ liệu.");
        if (!await selectClassForRegistration(classRow,token)) {
          halt();
          status("Chưa xác nhận được chi tiết lớp " + item.lhp + ". Kiểm tra trang HUIT trước khi bật lại.");
          break;
        }
        if (stopped || token !== epoch) break;
        const groupSelect = [...document.querySelectorAll("select")].find(el =>
          normalize(el.closest("label")?.textContent || el.parentElement?.textContent).includes("nhom thuc hanh"));
        if (groupSelect && !groupSelect.disabled) {
          const options = [...groupSelect.options].filter(option => option.value && !option.disabled);
          if (options.length) {
            if (!item.group) {
              halt();
              status("Lớp " + item.lhp + " có nhóm thực hành. Nhập nhóm ở cột thứ ba rồi lưu danh sách.");
              break;
            }
            const option = options.find(option => option.value === item.group || normalize(option.textContent) === normalize(item.group));
            if (!option) {
              halt();
              status("Không tìm thấy nhóm thực hành " + item.group + " của lớp " + item.lhp);
              break;
            }
            groupSelect.value = option.value;
            groupSelect.dispatchEvent(new Event("change",{bubbles:true}));
            await sleep(800);
          }
        } else if (item.group) {
          halt();
          status("Chưa tìm thấy ô chọn nhóm thực hành của " + item.lhp);
          break;
        }
        if (stopped || token !== epoch) break;
        if (context() !== state.autoContext) throw new Error("Đợt đăng ký đã thay đổi.");
        if (isRegistered(item.lhp)) { item.result = "done"; continue; }
        const button = registrationButton();
        if (!button || button.disabled || button.getAttribute("aria-disabled") === "true" || !button.getClientRects().length) {
          halt();
          status("Nút đăng ký chưa sẵn sàng cho " + item.lhp + ". Kiểm tra lịch và thông báo HUIT.");
          break;
        }
        // Persist intent before submission so a navigation or lost response cannot cause a duplicate send.
        item.result = "pending";
        await persist();
        renderPlan();
        if (stopped || token !== epoch) break;
        button.click();
        const deadline = Date.now() + 15000;
        while (Date.now() < deadline && !stopped && token === epoch && !isRegistered(item.lhp)) await sleep(300);
        if (isRegistered(item.lhp)) {
          item.result = "done";
          await persist();
          renderPlan();
        } else {
          halt();
          status("Đã gửi lớp " + item.lhp + " nhưng chưa xác nhận thành công. Kiểm tra kết quả/thông báo HUIT trước khi tiếp tục.");
          break;
        }
      }
      await persist();
      renderPlan();
      if (state.plan.every(item => item.result === "done")) {
        halt();
        status("Đã xác nhận tất cả Mã LHP trong bảng lớp đã đăng ký. Kiểm tra lại lịch trên HUIT.");
      } else if (!stopped) {
        status("Chờ lượt tiếp theo cho các lớp chưa đăng ký được.");
      }
    } catch (error) {
      halt();
      status("Đã dừng tự động: " + error.message);
    } finally {
      busy = false;
      $("scan").disabled = false;
      render();
      renderPlan();
    }
  }

  async function tick() {
    if (!state.watching) return;
    const start = state.start ? new Date(state.start).getTime() : Date.now();
    if (Date.now() < start) {
      status("Đang chờ • còn " + Math.ceil((start-Date.now())/1000) + " giây. Giữ tab và máy hoạt động.");
      timer = setTimeout(tick,1000);
      return;
    }
    if (!courseRows().length) {
      status("Chưa có môn. Sắp tải lại trang để kiểm tra.");
      timer = setTimeout(() => { if (state.watching) location.reload(); },state.interval*1000);
      return;
    }
    if (state.auto) await autoRegister();
    else await scan();
    if (state.watching) timer = setTimeout(tick,state.interval*1000);
  }
  $("launcher").onclick = () => { $("panel").hidden = !$("panel").hidden; };
  $("hide").onclick = () => { $("panel").hidden = true; };
  $("search").oninput = render;
  $("savedOnly").onchange = render;
  $("stop").onclick = () => { halt(); status("Đã dừng theo dõi."); };
  $("scan").onclick = () => { halt(); scan(); };
  $("watch").onclick = async () => {
    if (busy) { status("Hãy dừng và đợi lượt đọc hiện tại kết thúc."); return; }
    const interval = Number($("interval").value);
    if (!Number.isFinite(interval) || interval < 1 || interval > 300) { status("Nhập thời gian từ 1 đến 300 giây."); return; }
    if ($("start").value && !Number.isFinite(new Date($("start").value).getTime())) { status("Giờ bắt đầu không hợp lệ."); return; }
    clearTimeout(timer);
    state.start = $("start").value;
    state.interval = interval;
    state.auto = false;
    state.watching = true;
    stopped = false;
    await persist();
    tick();
  };

  $("savePlan").onclick = async () => {
    if (busy) { status("Dừng và đợi lượt xử lý kết thúc trước khi lưu."); return; }
    try {
      const plan = parsePlan($("plan").value);
      if (!plan.length) throw new Error("Nhập ít nhất một cặp Mã HP và Mã LHP.");
      halt();
      state.plan = plan;
      state.planText = $("plan").value;
      await persist();
      renderPlan();
      status("Đã lưu danh sách. Chọn đúng đợt trên HUIT rồi bấm Bật tự đăng ký.");
    } catch (error) { status(error.message); }
  };
  $("arm").onclick = async () => {
    if (busy) { status("Dừng và đợi lượt xử lý kết thúc trước khi bật."); return; }
    if (!state.plan?.length || $("plan").value !== state.planText) {
      status("Lưu danh sách mã trước khi bật tự đăng ký.");
      return;
    }
    if (!context()) { status("Chưa xác định được đợt đăng ký trên HUIT."); return; }
    $("watch").click();
    if (!state.watching) return;
    state.auto = true;
    state.autoContext = context();
    await persist();
    renderPlan();
  };

  chrome.storage.local.get(STORE).then(data => {
    state = {...state,...data[STORE]};
    $("start").value = state.start;
    $("interval").value = state.interval;
    $("plan").value = state.planText;
    renderPlan();
    render();
    status("Sẵn sàng. Dữ liệu lưu trước đó có kèm thời điểm đọc.");
    if (state.watching) tick();
  }).catch(error => status("Không đọc được bộ nhớ: " + error.message));
})();
