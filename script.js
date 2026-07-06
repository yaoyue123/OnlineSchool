// 动态生成默认的非敏感请假条数据（基于当前系统时间）
function getDefaultConfig() {
  const now = new Date();
  
  const formatDateTime = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}`;
  };

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // 请假开始时间为当前时间
  const startTimeStr = formatDateTime(now);
  
  // 请假结束时间默认往后推 1 天并在 21:30 结束
  const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const endTimeStr = `${formatDate(end)} 21:30`;

  // 审批时间默认在 4 天前的此时 (带秒数)
  const audit = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  const auditY = audit.getFullYear();
  const auditM = String(audit.getMonth() + 1).padStart(2, '0');
  const auditD = String(audit.getDate()).padStart(2, '0');
  const auditH = String(audit.getHours()).padStart(2, '0');
  const auditMin = String(audit.getMinutes()).padStart(2, '0');
  const auditS = String(audit.getSeconds()).padStart(2, '0');
  const auditTimeStr = `${auditY}-${auditM}-${auditD} ${auditH}:${auditMin}:${auditS}`;

  const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const day1Week = weekDays[now.getDay()];
  const day2Week = weekDays[end.getDay()];

  return {
    name: "张三",
    className: "数字化建运1班",
    type: "因私事",
    reason: "因病请假就医",
    reasonDetail: "因身体不适需请假前往医院就医",
    startTime: startTimeStr,
    endTime: endTimeStr,
    leaveSchool: "是",
    leaveCity: "是",

    totalLeaves: 1,
    totalHours: "0/828",
    listTodo: "您当前有1个请假待销假",
    currentPage: "list",

    status: "已同意",
    progress: "1/1",
    auditor: "王老师",
    auditTime: auditTimeStr,

    dailySchedule: [
      {
        id: "day_1",
        date: `${formatDate(now)} ${day1Week} （只计上午3节课时）`,
        hours: 0,
        allPeriods: ["1", "2", "3", "午休", "4", "5", "6", "晚自习"],
        selectedPeriods: ["午休", "4", "5", "6", "晚自习"]
      },
      {
        id: "day_2",
        date: `${formatDate(end)} ${day2Week} （不计课时）`,
        hours: 0,
        allPeriods: ["1", "2", "3", "午休", "4", "5", "6", "晚自习"],
        selectedPeriods: ["1", "2", "3", "午休", "4", "5", "6", "晚自习"]
      }
    ],

    attachmentImg: "default_stamp.png",
    xjAttachmentImg: "",
    xjCertImg: ""
  };
}

let config = {};

document.addEventListener("DOMContentLoaded", () => {
  loadConfig();
  initDrawerTabs();
  initDrawerPageSwitch();
  initImageUploads();
  initDrawerControllers();
  initPageFlow();
  
  // 首次渲染页面
  renderLeavePage();
});

// 1. 读取本地存储数据
function loadConfig() {
  const saved = localStorage.getItem("leave_simulator_config_v2");
  const defaultConfig = getDefaultConfig();
  if (saved) {
    try {
      config = JSON.parse(saved);
      // 融合兜底默认值以防缺项
      config = { ...defaultConfig, ...config };
      
      // 防御性安全防范：确保 dailySchedule 确实为数组且数据项完整，防范因缓存版本冲突导致崩溃
      if (!config.dailySchedule || !Array.isArray(config.dailySchedule)) {
        config.dailySchedule = JSON.parse(JSON.stringify(defaultConfig.dailySchedule));
      } else {
        config.dailySchedule.forEach(day => {
          if (!day.id) day.id = "day_" + Math.random().toString(36).substr(2, 9);
          if (!day.date) day.date = "未知日期";
          if (day.hours === undefined) day.hours = 0;
          if (!day.allPeriods || !Array.isArray(day.allPeriods)) {
            day.allPeriods = ["1", "2", "3", "午休", "4", "5", "6", "晚自习"];
          }
          if (!day.selectedPeriods || !Array.isArray(day.selectedPeriods)) {
            day.selectedPeriods = [];
          }
        });
      }
    } catch (e) {
      config = JSON.parse(JSON.stringify(defaultConfig));
    }
  } else {
    config = JSON.parse(JSON.stringify(defaultConfig));
  }
}

// 2. 将配置数据同步渲染到高保真请假条上
function renderLeavePage() {
  // A. 页面一：列表统计与内容
  document.getElementById("viewTotalHours").innerText = config.totalHours;
  document.getElementById("viewListTodo").innerText = `待办事项：${config.listTodo}`;
  document.getElementById("viewTotalLeavesBottom").innerText = config.totalLeaves;
  
  document.getElementById("viewCardName").innerText = config.name;
  document.getElementById("viewCardClass").innerText = config.className;
  document.getElementById("viewCardReasonOuter").innerHTML = `${config.type} <span class="text-gray" id="viewCardReasonInner">${config.reason}</span>`;
  document.getElementById("viewCardTime").innerText = `${config.startTime}~${config.endTime}`;

  // 列表上的总课时数：由每日课时卡片数据累加得到
  const totalDaysHours = config.dailySchedule.reduce((sum, item) => sum + parseInt(item.hours || 0), 0);
  document.getElementById("viewCardHours").innerText = totalDaysHours;

  // 请假状态标签
  const setStatusBadge = (el, status) => {
    if (!el) return;
    if (status === "已同意" || status === "已销假") {
      el.className = "badge-agreed";
      el.innerHTML = `<svg viewBox="0 0 1024 1024" width="10" height="10" fill="currentColor" style="margin-right: 2px;"><path d="M912 190L383.6 718.4 112 446.8l-70.4 70.4 342 342L982.4 260.4z"></path></svg><span>${status}</span>`;
    } else {
      el.className = "badge-orange";
      el.innerHTML = `<span>${status}</span>`;
    }
  };
  setStatusBadge(document.getElementById("viewCardStatus"), config.status);
  setStatusBadge(document.getElementById("viewDetailStatus"), config.status);

  // B. 页面二：详情页基本表单
  document.getElementById("viewDetailProgress").innerText = config.progress;
  document.getElementById("viewAuditor").innerText = config.auditor;
  document.getElementById("viewAuditTime").innerText = `(${config.auditTime})`;
  
  document.getElementById("viewDetailName").innerText = config.name;
  document.getElementById("viewDetailClass").innerText = config.className;
  document.getElementById("viewDetailStartTime").innerText = config.startTime;
  document.getElementById("viewDetailEndTime").innerText = config.endTime;
  
  document.getElementById("viewDetailLeaveSchool").innerText = config.leaveSchool;
  document.getElementById("viewDetailLeaveCity").innerText = config.leaveCity;
  document.getElementById("viewDetailType").innerText = config.type;
  document.getElementById("viewDetailReason").innerText = config.reasonDetail;

  // 渲染每日明细卡片
  renderDailyDetailCards();

  // 渲染上传图片
  document.getElementById("imgAttachment").src = config.attachmentImg || "default_stamp.png";
  
  const setupImagePlaceholder = (imgId, boxId, base64) => {
    const img = document.getElementById(imgId);
    const box = document.getElementById(boxId);
    const icon = box.querySelector(".icon-placeholder");
    
    if (base64) {
      img.src = base64;
      img.style.display = "block";
      if (icon) icon.style.display = "none";
      box.style.padding = "0";
      box.style.border = "none";
    } else {
      img.style.display = "none";
      if (icon) icon.style.display = "block";
      box.style.padding = "";
      box.style.border = "";
    }
  };
  setupImagePlaceholder("imgXjAttachment", "boxXjAttachment", config.xjAttachmentImg);
  setupImagePlaceholder("imgXjCert", "boxXjCert", config.xjCertImg);

  // C. 页面容器显示切换
  const pageList = document.getElementById("pageList");
  const pageDetail = document.getElementById("pageDetail");
  const btnGoBack = document.getElementById("btnGoBack");

  if (config.currentPage === "detail") {
    pageList.classList.remove("active");
    pageDetail.classList.add("active");
    btnGoBack.style.opacity = "1";
    btnGoBack.style.cursor = "pointer";
  } else {
    pageDetail.classList.remove("active");
    pageList.classList.add("active");
    btnGoBack.style.opacity = "0.3";
    btnGoBack.style.cursor = "default";
  }
}

// 渲染详情页里的课时卡片数据
function renderDailyDetailCards() {
  const container = document.getElementById("dailyCardsContainer");
  container.innerHTML = "";

  config.dailySchedule.forEach(day => {
    const card = document.createElement("div");
    card.className = "daily-detail-card";

    const title = document.createElement("div");
    title.className = "daily-card-title";
    title.innerText = day.date;
    card.appendChild(title);

    const row = document.createElement("div");
    row.className = "daily-card-row";
    row.innerHTML = `<span>课时：</span><span class="daily-hours-num">${day.hours}</span> <span>已请假节次：</span>`;
    card.appendChild(row);

    const tagsContainer = document.createElement("div");
    tagsContainer.className = "daily-tags-container";

    day.allPeriods.forEach(period => {
      const isSelected = day.selectedPeriods.includes(period);
      const tag = document.createElement("span");
      tag.className = "daily-tag" + (isSelected ? "" : " inactive");
      tag.innerText = period;
      tagsContainer.appendChild(tag);
    });

    card.appendChild(tagsContainer);
    container.appendChild(card);
  });
}

// 3. 页面点击跳转逻辑 (列表->详情，详情->列表)
function initPageFlow() {
  const listCard = document.getElementById("listLeaveCard");
  const btnGoBack = document.getElementById("btnGoBack");

  listCard.addEventListener("click", () => {
    config.currentPage = "detail";
    saveConfigOnly();
    renderLeavePage();
  });

  btnGoBack.addEventListener("click", () => {
    if (config.currentPage === "detail") {
      config.currentPage = "list";
      saveConfigOnly();
      renderLeavePage();
    }
  });
}

// 4. 配置弹窗中的选项卡切换
function initDrawerTabs() {
  const tabs = document.querySelectorAll(".drawer-tab-btn");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const target = tab.getAttribute("data-tab");
      const panels = document.querySelectorAll(".drawer-tab-panel");
      panels.forEach(p => {
        p.classList.remove("active");
        if (p.id === target) p.classList.add("active");
      });
    });
  });
}

// 配置抽屉内页面单选切换
function initDrawerPageSwitch() {
  const btnList = document.getElementById("drawerBtnList");
  const btnDetail = document.getElementById("drawerBtnDetail");

  btnList.addEventListener("click", () => {
    btnList.classList.add("active");
    btnDetail.classList.remove("active");
  });

  btnDetail.addEventListener("click", () => {
    btnDetail.classList.add("active");
    btnList.classList.remove("active");
  });
}

// 5. 点击图片附件实时替换
function initImageUploads() {
  const triggerMap = [
    { triggerId: "imgAttachment", inputId: "fileAttachment", key: "attachmentImg" },
    { triggerId: "boxXjAttachment", inputId: "fileXjAttachment", key: "xjAttachmentImg" },
    { triggerId: "boxXjCert", inputId: "fileXjCert", key: "xjCertImg" }
  ];

  triggerMap.forEach(item => {
    const trigger = document.getElementById(item.triggerId);
    const input = document.getElementById(item.inputId);

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      // 处于截图模式时不响应
      if (document.getElementById("app").classList.contains("screenshot-mode")) return;
      input.click();
    });

    input.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        config[item.key] = event.target.result;
        saveConfigOnly();
        renderLeavePage();
      };
      reader.readAsDataURL(file);
    });
  });
}

// 6. 配置抽屉的打开、关闭与表单收集交互
function initDrawerControllers() {
  const app = document.getElementById("app");
  const drawer = document.getElementById("configDrawer");
  const btnsOpen = document.querySelectorAll(".btn-open-config");
  const btnClose = document.getElementById("btnCloseDrawer");
  const btnApply = document.getElementById("btnApplyClose");
  const btnScreenshot = document.getElementById("btnEnterScreenshot");
  const btnReset = document.getElementById("btnResetData");

  // 打开抽屉弹窗并回填表单
  btnsOpen.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      drawer.classList.add("open");
      fillDrawerFields();
      renderDrawerDailyDays();
    });
  });

  // 关闭抽屉弹窗 (不应用修改)
  btnClose.addEventListener("click", () => {
    drawer.classList.remove("open");
  });

  // 应用修改并关闭
  btnApply.addEventListener("click", () => {
    collectDrawerFields();
    saveConfigOnly();
    renderLeavePage();
    drawer.classList.remove("open");
  });

  // 隐藏按钮并截图模式
  btnEnterScreenshot.addEventListener("click", () => {
    collectDrawerFields();
    saveConfigOnly();
    renderLeavePage();
    drawer.classList.remove("open");
    
    // 进入截图模式，隐藏悬浮配置按钮
    app.classList.add("screenshot-mode");
  });

  // 重置数据
  btnReset.addEventListener("click", () => {
    if (confirm("确定要重置请假条数据为默认值吗？")) {
      localStorage.removeItem("leave_simulator_config_v2");
      loadConfig();
      renderLeavePage();
      drawer.classList.remove("open");
    }
  });

  // 双击屏幕空白处，恢复显示悬浮配置按钮 (退出只读模式)
  app.addEventListener("dblclick", () => {
    if (app.classList.contains("screenshot-mode")) {
      app.classList.remove("screenshot-mode");
      alert("已退出截图模式，配置按钮已显示。");
    }
  });

  // 配置弹窗添加一天卡片
  document.getElementById("cfgBtnAddDay").addEventListener("click", () => {
    const dateStr = prompt("请输入日期标题：", "2026-06-15 周一");
    if (!dateStr || !dateStr.trim()) return;

    config.dailySchedule.push({
      id: "day_" + Date.now(),
      date: dateStr.trim(),
      hours: 0,
      allPeriods: ["1", "2", "3", "午休", "4", "5", "6", "晚自习"],
      selectedPeriods: ["1", "2", "3"]
    });
    renderDrawerDailyDays();
  });
}

// 仅保存数据到本地
function saveConfigOnly() {
  localStorage.setItem("leave_simulator_config_v2", JSON.stringify(config));
}

// 把当前配置参数回填至 Drawer 表单输入框中
function fillDrawerFields() {
  // 页面切换按钮状态
  const btnList = document.getElementById("drawerBtnList");
  const btnDetail = document.getElementById("drawerBtnDetail");
  if (config.currentPage === "detail") {
    btnDetail.classList.add("active");
    btnList.classList.remove("active");
  } else {
    btnList.classList.add("active");
    btnDetail.classList.remove("active");
  }

  document.getElementById("cfgName").value = config.name;
  document.getElementById("cfgClass").value = config.className;
  document.getElementById("cfgType").value = config.type;
  document.getElementById("cfgReason").value = config.reason;
  document.getElementById("cfgReasonDetail").value = config.reasonDetail;
  document.getElementById("cfgStartTime").value = config.startTime;
  document.getElementById("cfgEndTime").value = config.endTime;
  document.getElementById("cfgLeaveSchool").value = config.leaveSchool;
  document.getElementById("cfgLeaveCity").value = config.leaveCity;
  
  document.getElementById("cfgStatus").value = config.status;
  document.getElementById("cfgProgress").value = config.progress;
  document.getElementById("cfgAuditor").value = config.auditor;
  document.getElementById("cfgAuditTime").value = config.auditTime;
  
  document.getElementById("cfgTotalLeaves").value = config.totalLeaves;
  document.getElementById("cfgTotalHours").value = config.totalHours;
  document.getElementById("cfgListTodo").value = config.listTodo;
}

// 收集 Drawer 表单数值并写入 config 对象中
function collectDrawerFields() {
  // 获取单选页面状态
  const isDetail = document.getElementById("drawerBtnDetail").classList.contains("active");
  config.currentPage = isDetail ? "detail" : "list";

  config.name = document.getElementById("cfgName").value;
  config.className = document.getElementById("cfgClass").value;
  config.type = document.getElementById("cfgType").value;
  config.reason = document.getElementById("cfgReason").value;
  config.reasonDetail = document.getElementById("cfgReasonDetail").value;
  config.startTime = document.getElementById("cfgStartTime").value;
  config.endTime = document.getElementById("cfgEndTime").value;
  config.leaveSchool = document.getElementById("cfgLeaveSchool").value;
  config.leaveCity = document.getElementById("cfgLeaveCity").value;

  config.status = document.getElementById("cfgStatus").value;
  config.progress = document.getElementById("cfgProgress").value;
  config.auditor = document.getElementById("cfgAuditor").value;
  config.auditTime = document.getElementById("cfgAuditTime").value;

  config.totalLeaves = parseInt(document.getElementById("cfgTotalLeaves").value) || 0;
  config.totalHours = document.getElementById("cfgTotalHours").value;
  config.listTodo = document.getElementById("cfgListTodo").value;

  // 收集每日明细卡片的最新编辑值
  const cardElements = document.querySelectorAll(".cfg-day-edit-card");
  const newSchedule = [];

  if (!config.dailySchedule || !Array.isArray(config.dailySchedule)) {
    config.dailySchedule = [];
  }

  cardElements.forEach(cardEl => {
    const id = cardEl.getAttribute("data-day-id");
    const date = cardEl.querySelector(".cfg-date-title-input").value;
    const hours = parseInt(cardEl.querySelector(".cfg-hours-input").value) || 0;

    // 收集选中的节次
    const checkedPeriods = [];
    const checkboxes = cardEl.querySelectorAll(".cfg-checkbox-grid input[type='checkbox']");
    checkboxes.forEach(cb => {
      if (cb.checked) checkedPeriods.push(cb.value);
    });

    const originalDay = config.dailySchedule.find(d => d.id === id);
    const allPeriods = originalDay ? originalDay.allPeriods : ["1", "2", "3", "午休", "4", "5", "6", "晚自习"];

    newSchedule.push({
      id,
      date,
      hours,
      allPeriods,
      selectedPeriods: checkedPeriods
    });
  });

  config.dailySchedule = newSchedule;
}

// 动态在配置抽屉中渲染课时列表编辑界面
function renderDrawerDailyDays() {
  const container = document.getElementById("cfgDaysContainer");
  container.innerHTML = "";

  config.dailySchedule.forEach((day, index) => {
    const card = document.createElement("div");
    card.className = "cfg-day-edit-card";
    card.setAttribute("data-day-id", day.id);

    // 删除单日卡片按钮
    const btnDel = document.createElement("button");
    btnDel.className = "cfg-btn-delete-day";
    btnDel.innerText = "删除";
    btnDel.type = "button";
    btnDel.addEventListener("click", () => {
      config.dailySchedule.splice(index, 1);
      renderDrawerDailyDays();
    });
    card.appendChild(btnDel);

    // 标题输入
    const groupTitle = document.createElement("div");
    groupTitle.className = "drawer-form-group";
    groupTitle.innerHTML = `<label>日期及标题</label><input type="text" class="cfg-date-title-input" value="${day.date}">`;
    card.appendChild(groupTitle);

    // 课时数输入
    const groupHours = document.createElement("div");
    groupHours.className = "drawer-form-group";
    groupHours.innerHTML = `<label>当前课时数</label><input type="number" class="cfg-hours-input" value="${day.hours}">`;
    card.appendChild(groupHours);

    // 节次多选框
    const groupPeriods = document.createElement("div");
    groupPeriods.className = "drawer-form-group";
    groupPeriods.innerHTML = `<label>已请假节次 (勾选表示已请假)</label>`;

    const grid = document.createElement("div");
    grid.className = "cfg-checkbox-grid";

    day.allPeriods.forEach(period => {
      const isChecked = day.selectedPeriods.includes(period);
      const label = document.createElement("label");
      label.className = "cfg-checkbox-label" + (isChecked ? " checked" : "");
      label.innerHTML = `<input type="checkbox" value="${period}" ${isChecked ? "checked" : ""}> <span>${period}</span>`;
      
      const checkbox = label.querySelector("input");
      checkbox.addEventListener("change", (e) => {
        if (e.target.checked) {
          label.classList.add("checked");
        } else {
          label.classList.remove("checked");
        }
      });
      grid.appendChild(label);
    });

    groupPeriods.appendChild(grid);
    card.appendChild(groupPeriods);
    container.appendChild(card);
  });
}

// 模拟刷新按钮刷新动画
document.getElementById("btnRefresh").addEventListener("click", (e) => {
  e.stopPropagation();
  const btn = document.getElementById("btnRefresh");
  btn.style.transform = "rotate(360deg)";
  btn.style.transition = "transform 0.5s ease-in-out";
  setTimeout(() => {
    btn.style.transform = "none";
    btn.style.transition = "none";
    alert("列表刷新成功");
  }, 500);
});

// 模拟加号按钮动作
document.getElementById("btnAddLeave").addEventListener("click", (e) => {
  e.stopPropagation();
  alert("已发起新申请");
});
