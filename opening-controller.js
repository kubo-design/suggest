(() => {
  const q = (sel) => document.querySelector(sel);
  const STYLE_ID = 'opening-controller-inline-style';
  const LABEL_HISTORY_KEY = 'opening-controller-label-history';
  const STOP_AFTER_KEY = 'opening-controller-stop-after';
  const CONTROLLER_VISIBLE_KEY = 'opening-controller-visible';
  const STAGE_ORDER = [
    'blank',
    'grow-x',
    'image',
    'full',
    'overlay-fade',
    'overlay-image',
    'osa-hold-90',
    'osa-fade-out',
    'ippo-pop',
    'line1-show',
    'line1-grow',
    'line1-reveal',
    'line2-grow',
    'line2-reveal',
    'line2-pause',
    'line2-hold',
    'logo-fade',
    'logo-hold',
    'outro'
  ];
  const STAGE_ORDER_MAP = Object.fromEntries(STAGE_ORDER.map((stage, idx) => [stage, idx]));
  let activeControllerRoot = null;

  const isControllerVisible = () => {
    try {
      const stored = window.localStorage.getItem(CONTROLLER_VISIBLE_KEY);
      if (stored === null) return false;
      return stored === '1';
    } catch (_err) {
      return false;
    }
  };

  const setControllerVisible = (visible) => {
    const root = activeControllerRoot || q('[data-opening-controller]');
    if (root) root.style.display = visible ? '' : 'none';
    try {
      window.localStorage.setItem(CONTROLLER_VISIBLE_KEY, visible ? '1' : '0');
    } catch (_err) {
      // no-op
    }
  };

  window.showOpeningController = () => setControllerVisible(true);
  window.hideOpeningController = () => setControllerVisible(false);

  const ensureStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
.opening__controller {
  position: fixed;
  right: 12px;
  bottom: 12px;
  z-index: 9999;
  width: min(360px, calc(100vw - 24px));
  padding: 30px 10px 10px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.68);
  color: #fff;
  font-family: "Zen Kaku Gothic New", sans-serif;
  font-size: 12px;
}
.opening__controller [data-opening-toggle] {
  position: absolute;
  top: 6px;
  right: 6px;
  height: 20px;
  padding: 0 8px;
  font-size: 11px;
  line-height: 1;
}
.opening__controller.is-collapsed {
  width: auto;
  min-width: 0;
  padding: 8px 40px 8px 8px;
}
.opening__controller.is-collapsed .opening__controller-row,
.opening__controller.is-collapsed .opening__controller-list,
.opening__controller.is-collapsed .opening__controller-scrub {
  display: none;
}
@media (max-width: 900px) {
  .opening__controller {
    left: 50%;
    right: auto;
    bottom: 12px;
    width: min(420px, calc(100vw - 24px));
    transform: translateX(-50%);
  }
}
@media (max-width: 560px) {
  .opening__controller {
    left: 8px;
    right: 8px;
    bottom: 8px;
    width: auto;
    transform: none;
  }
}
.opening__controller-row {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
}
.opening__controller button,
.opening__controller input[type="text"] {
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  height: 30px;
  padding: 0 8px;
}
.opening__controller button {
  cursor: pointer;
}
.opening__controller input[type="text"] {
  flex: 1;
}
.opening__controller label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.opening__controller-list {
  max-height: none;
  overflow: visible;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 4px 6px;
  margin-bottom: 8px;
}
.opening__controller-list > div {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 2px 0;
  line-height: 1.35;
}
.opening__controller-list > div > span {
  flex: 1;
  min-width: 0;
  word-break: break-word;
  cursor: pointer;
}
.opening__controller-list > div.is-current > span {
  color: #ff5a5a;
}
.opening__controller-list > div > button {
  height: 24px;
  padding: 0 6px;
  font-size: 11px;
}
.opening__controller-list > div > button[data-label-stop] {
  background: rgba(120, 180, 255, 0.2);
  border-color: rgba(140, 200, 255, 0.5);
}
.opening__controller-scrub input[type="range"] {
  width: 100%;
  cursor: ew-resize;
}
`;
    document.head.appendChild(style);
  };

  const ensureControllerRoot = () => {
    const existing = q('[data-opening-controller]');
    if (existing) {
      if (existing.parentElement !== document.body) {
        document.body.appendChild(existing);
      }
      return existing;
    }

    const root = document.createElement('div');
    root.className = 'opening__controller';
    root.setAttribute('data-opening-controller', '');
    root.innerHTML = `
      <div class="opening__controller-row">
        <button type="button" data-opening-play>再生</button>
        <button type="button" data-opening-pause>停止</button>
        <button type="button" data-opening-back>戻す</button>
        <button type="button" data-opening-step>コマ送り</button>
        <button type="button" data-opening-reload>再読込</button>
      </div>
      <div class="opening__controller-row">
        <input type="text" placeholder="停止箇所ラベル" data-opening-label-input />
        <button type="button" data-opening-label-add>ラベル追加</button>
        <button type="button" data-opening-label-clear>全クリア</button>
      </div>
      <div class="opening__controller-row">
        <label>
          <input type="checkbox" data-opening-stop-after />
          オープニング後に停止
        </label>
      </div>
      <div class="opening__controller-list" data-opening-label-list></div>
      <div class="opening__controller-scrub">
        <input type="range" min="0" max="1000" value="0" data-opening-scrub />
      </div>
    `;
    document.body.appendChild(root);
    return root;
  };

  const ensureToggleButton = (root) => {
    let btn = root.querySelector('[data-opening-toggle]');
    if (btn) return btn;
    btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('data-opening-toggle', '');
    btn.textContent = '非表示';
    root.prepend(btn);
    return btn;
  };

  window.createOpeningController = (opts) => {
    ensureStyle();
    const root = ensureControllerRoot();
    if (!root) return null;
    activeControllerRoot = root;
    const toggleBtn = ensureToggleButton(root);
    setControllerVisible(isControllerVisible());

    const playBtn = q('[data-opening-play]');
    const pauseBtn = q('[data-opening-pause]');
    const backBtn = q('[data-opening-back]');
    const stepBtn = q('[data-opening-step]');
    const reloadBtn = q('[data-opening-reload]');
    const labelInput = q('[data-opening-label-input]');
    const labelAddBtn = q('[data-opening-label-add]');
    const labelClearBtn = q('[data-opening-label-clear]');
    const stopAfterCheckbox = q('[data-opening-stop-after]');
    const labelList = q('[data-opening-label-list]');
    const scrub = q('[data-opening-scrub]');
    const readLabelHistory = () => {
      try {
        const raw = window.localStorage.getItem(LABEL_HISTORY_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(
          (item) =>
            item &&
            typeof item.stage === 'string' &&
            typeof item.text === 'string' &&
            (typeof item.stageIndex === 'number' || typeof item.stageIndex === 'undefined') &&
            (typeof item.progress === 'number' || typeof item.progress === 'undefined') &&
            (typeof item.bg === 'string' || typeof item.bg === 'undefined')
        );
      } catch (_err) {
        return [];
      }
    };
    const writeLabelHistory = (items) => {
      try {
        window.localStorage.setItem(LABEL_HISTORY_KEY, JSON.stringify(items));
      } catch (_err) {
        // no-op
      }
    };
    const readStopAfter = () => {
      try {
        return window.localStorage.getItem(STOP_AFTER_KEY) === '1';
      } catch (_err) {
        return false;
      }
    };
    const writeStopAfter = (checked) => {
      try {
        window.localStorage.setItem(STOP_AFTER_KEY, checked ? '1' : '0');
      } catch (_err) {
        // no-op
      }
    };
    let labels = readLabelHistory();

    const call = (fn) => {
      if (typeof fn === 'function') fn();
    };

    const onPlay = () => call(opts.play);
    const onPause = () => call(opts.pause);
    const onBack = () => call(opts.back);
    const onStep = () => call(opts.step);
    const onReload = () => call(opts.reload);
    const onStopAfterChange = () => {
      writeStopAfter(Boolean(stopAfterCheckbox?.checked));
    };
    const onScrub = () => {
      if (!scrub || typeof opts.onScrub !== 'function') return;
      opts.onScrub(Number(scrub.value) / 1000);
    };
    const onToggle = () => {
      if (!root || !toggleBtn) return;
      const collapsed = root.classList.toggle('is-collapsed');
      toggleBtn.textContent = collapsed ? '表示' : '非表示';
    };
    const markCurrentLabel = (stage) => {
      if (!labelList) return;
      const rows = labelList.querySelectorAll('div[data-label-stage]');
      rows.forEach((row) => {
        row.classList.toggle('is-current', stage && row.dataset.labelStage === stage);
      });
    };
    const renderLabels = () => {
      if (!labelList) return;
      labelList.innerHTML = '';
      const getOrder = (entry) => {
        if (typeof entry.progress === 'number' && Number.isFinite(entry.progress)) {
          return entry.progress;
        }
        if (typeof entry.stageIndex === 'number' && Number.isFinite(entry.stageIndex)) {
          return entry.stageIndex;
        }
        if (entry.stage && Object.prototype.hasOwnProperty.call(STAGE_ORDER_MAP, entry.stage)) {
          return STAGE_ORDER_MAP[entry.stage];
        }
        return 9999;
      };
      const orderedLabels = labels
        .map((entry, originalIndex) => ({ entry, originalIndex }))
        .sort((a, b) => {
          const diff = getOrder(a.entry) - getOrder(b.entry);
          if (diff !== 0) return diff;
          return a.originalIndex - b.originalIndex;
        });
      orderedLabels.forEach(({ entry, originalIndex }) => {
        const item = document.createElement('div');
        item.dataset.labelStage = entry.stage || 'unknown';
        const labelText = document.createElement('span');
        labelText.textContent = `${entry.stage || 'unknown'}: ${entry.text}`;
        labelText.addEventListener('click', () => {
          const state = typeof opts.getState === 'function' ? opts.getState() : null;
          const isPaused = Boolean(state?.paused);
          const hasProgress = typeof entry.progress === 'number' && Number.isFinite(entry.progress);
          if (isPaused && hasProgress && typeof opts.stopAtProgress === 'function') {
            opts.stopAtProgress(entry.progress);
            return;
          }
          if (isPaused && typeof opts.stopAtStage === 'function') {
            opts.stopAtStage(entry.stage || '', entry.bg || '');
            return;
          }
          if (hasProgress && typeof opts.playFromProgress === 'function') {
            opts.playFromProgress(entry.progress);
            return;
          }
          if (typeof opts.playFromStage === 'function') {
            opts.playFromStage(entry.stage || '', entry.bg || '');
            return;
          }
          if (typeof opts.stopAtStage === 'function') {
            opts.stopAtStage(entry.stage || '', entry.bg || '');
          }
        });

        const overwriteBtn = document.createElement('button');
        overwriteBtn.type = 'button';
        overwriteBtn.textContent = '上書き';
        overwriteBtn.addEventListener('click', () => {
          if (!labelInput || typeof opts.getState !== 'function') return;
          const nextText = labelInput.value.trim();
          if (!nextText) return;
          const nextState = opts.getState();
          if (!nextState || !nextState.paused) return;
          labels[originalIndex] = {
            stage: nextState.stage || 'unknown',
            text: nextText,
            stageIndex: nextState.stageIndex ?? 9999,
            progress: nextState.progress,
            bg: nextState.bg || ''
          };
          writeLabelHistory(labels);
          renderLabels();
          labelInput.value = '';
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.textContent = '削除';
        deleteBtn.addEventListener('click', () => {
          labels.splice(originalIndex, 1);
          writeLabelHistory(labels);
          renderLabels();
        });

        const playBtn = document.createElement('button');
        playBtn.type = 'button';
        playBtn.textContent = '再生';
        playBtn.setAttribute('data-label-play', '');
        playBtn.addEventListener('click', () => {
          if (typeof opts.playFromStage === 'function') {
            opts.playFromStage(entry.stage || '', entry.bg || '');
            return;
          }
          if (typeof opts.play === 'function') opts.play();
        });

        const stopBtn = document.createElement('button');
        stopBtn.type = 'button';
        stopBtn.textContent = '停止';
        stopBtn.setAttribute('data-label-stop', '');
        stopBtn.addEventListener('click', () => {
          if (typeof opts.stopAtStage === 'function') {
            opts.stopAtStage(entry.stage || '', entry.bg || '');
            return;
          }
          if (typeof opts.pause === 'function') opts.pause();
        });

        item.appendChild(labelText);
        item.appendChild(stopBtn);
        item.appendChild(playBtn);
        item.appendChild(overwriteBtn);
        item.appendChild(deleteBtn);
        labelList.appendChild(item);
      });
      if (typeof opts.getState === 'function') {
        const state = opts.getState();
        markCurrentLabel(state?.stage || '');
      }
    };
    const onAddLabel = () => {
      if (!labelInput || !labelList || typeof opts.getState !== 'function') return;
      const text = labelInput.value.trim();
      if (!text) return;
      const state = opts.getState();
      if (!state || !state.paused) return;

      labels.push({
        stage: state.stage || 'unknown',
        text,
        stageIndex: state.stageIndex ?? 9999,
        progress: state.progress,
        bg: state.bg || ''
      });
      writeLabelHistory(labels);
      renderLabels();
      labelInput.value = '';
    };
    const onClearLabels = () => {
      labels = [];
      writeLabelHistory(labels);
      renderLabels();
    };

    if (playBtn) playBtn.addEventListener('click', onPlay);
    if (pauseBtn) pauseBtn.addEventListener('click', onPause);
    if (backBtn) backBtn.addEventListener('click', onBack);
    if (stepBtn) stepBtn.addEventListener('click', onStep);
    if (reloadBtn) reloadBtn.addEventListener('click', onReload);
    if (stopAfterCheckbox) {
      stopAfterCheckbox.checked = readStopAfter();
      stopAfterCheckbox.addEventListener('change', onStopAfterChange);
    }
    if (scrub) scrub.addEventListener('input', onScrub);
    if (labelAddBtn) labelAddBtn.addEventListener('click', onAddLabel);
    if (labelClearBtn) labelClearBtn.addEventListener('click', onClearLabels);
    if (toggleBtn) toggleBtn.addEventListener('click', onToggle);
    renderLabels();

    return {
      update: (state) => {
        if (!scrub || !state) return;
        const progress = typeof state.progress === 'number'
          ? state.progress
          : (() => {
              const denom = Math.max(1, (state.stageCount || 1) - 1);
              return (state.stageIndex || 0) / denom;
            })();
        scrub.value = String(Math.round(progress * 1000));
        markCurrentLabel(state.stage || '');
      },
      shouldStopAfterOpening: () => Boolean(stopAfterCheckbox?.checked),
      hide: () => {
        setControllerVisible(false);
      },
      show: () => {
        setControllerVisible(true);
      },
      destroy: () => {
        if (playBtn) playBtn.removeEventListener('click', onPlay);
        if (pauseBtn) pauseBtn.removeEventListener('click', onPause);
        if (backBtn) backBtn.removeEventListener('click', onBack);
        if (stepBtn) stepBtn.removeEventListener('click', onStep);
        if (reloadBtn) reloadBtn.removeEventListener('click', onReload);
        if (stopAfterCheckbox) stopAfterCheckbox.removeEventListener('change', onStopAfterChange);
        if (scrub) scrub.removeEventListener('input', onScrub);
        if (labelAddBtn) labelAddBtn.removeEventListener('click', onAddLabel);
        if (labelClearBtn) labelClearBtn.removeEventListener('click', onClearLabels);
        if (toggleBtn) toggleBtn.removeEventListener('click', onToggle);
      }
    };
  };
})();
