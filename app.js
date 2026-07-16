    const COLORS = ['#0F62FE', '#198754', '#DC3545', '#FFC107', '#6610F2', '#FD7E14', '#20C997', '#E83E8C'];
    let cachedTransactions = [];
    let cachedAccounts = [];
    let cachedCategories = [];
    let cachedInvestments = [];
    let currentRankGroup = 'estabelecimento'; // ou 'categoria'

    // ==========================================
    // UTILITÁRIOS CENTRAIS
    // ==========================================
    function formatCurrency(value) {
      const n = Number(value) || 0;
      return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    function formatCurrencyCompact(value) {
      const n = Number(value) || 0;
      return n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
    }
    function escapeHtml(str) {
      if (str === null || str === undefined) return '';
      return String(str).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    }

    // ==========================================
    // SISTEMA DE ÍCONES (SVG inline, sem libs externas)
    // Ícones do SISTEMA (nav, botões, insights). Ícones de contas/categorias
    // continuam sendo emoji escolhidos livremente pelo usuário — são personalização, não UI de sistema.
    // ==========================================
    const ICONS = {
      dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"></rect><rect x="14" y="3" width="7" height="5" rx="1.5"></rect><rect x="14" y="12" width="7" height="9" rx="1.5"></rect><rect x="3" y="16" width="7" height="5" rx="1.5"></rect>',
      plusCircle: '<circle cx="12" cy="12" r="9"></circle><path d="M12 8v8"></path><path d="M8 12h8"></path>',
      landmark: '<path d="M3 21h18"></path><path d="M5 21v-8"></path><path d="M9 21v-8"></path><path d="M15 21v-8"></path><path d="M19 21v-8"></path><path d="M2 10l10-6 10 6"></path>',
      fileText: '<path d="M14.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5L14.5 3Z"></path><path d="M14 3v6h6"></path><path d="M9.5 13h5"></path><path d="M9.5 17h5"></path>',
      moreHorizontal: '<circle cx="5" cy="12" r="1.6"></circle><circle cx="12" cy="12" r="1.6"></circle><circle cx="19" cy="12" r="1.6"></circle>',
      search: '<circle cx="11" cy="11" r="7.5"></circle><path d="m20.5 20.5-4.3-4.3"></path>',
      moon: '<path d="M20.5 13.5A8.5 8.5 0 1 1 10.5 3.5 6.8 6.8 0 0 0 20.5 13.5Z"></path>',
      lock: '<rect x="4.5" y="11" width="15" height="9.5" rx="2"></rect><path d="M8 11V7.5a4 4 0 0 1 8 0V11"></path>',
      unlock: '<rect x="4.5" y="11" width="15" height="9.5" rx="2"></rect><path d="M8 11V7.5a4 4 0 0 1 7.4-1.9"></path>',
      trendingUp: '<path d="M3 17l6-6 4 4 8-8"></path><path d="M16 7h5v5"></path>',
      trendingDown: '<path d="M3 7l6 6 4-4 8 8"></path><path d="M16 17h5v-5"></path>',
      mapPin: '<path d="M19.5 10c0 6-7.5 11-7.5 11s-7.5-5-7.5-11a7.5 7.5 0 0 1 15 0Z"></path><circle cx="12" cy="10" r="2.7"></circle>',
      wallet: '<path d="M19 7.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1.5"></path><path d="M17.5 12a1.8 1.8 0 0 0 0 3.6H21V12Z"></path>',
      alertTriangle: '<path d="M10.4 4.2 2.3 18a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7-3L13.6 4.2a2 2 0 0 0-3.2 0Z"></path><path d="M12 9.5v4"></path><path d="M12 17h.01"></path>',
      checkCircle: '<circle cx="12" cy="12" r="9"></circle><path d="m8.5 12 2.3 2.3L15.5 9"></path>',
      shoppingBag: '<path d="M6.5 3 4 7v13a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 20V7l-2.5-4Z"></path><path d="M4 7h16"></path><path d="M15.5 10.5a3.5 3.5 0 0 1-7 0"></path>',
      calendar: '<rect x="3.5" y="4.5" width="17" height="16.5" rx="2"></rect><path d="M16 3v4"></path><path d="M8 3v4"></path><path d="M3.5 9.5h17"></path>',
      sparkles: '<path d="m12 3-1.6 4.4L6 9l4.4 1.6L12 15l1.6-4.4L18 9l-4.4-1.6Z"></path><path d="M5 3v3.5"></path><path d="M19 17v3.5"></path><path d="M3.2 4.8h3.5"></path><path d="M17.2 18.8h3.5"></path>',
      tag: '<path d="M12.5 2.5H3v9.5l9 9a2 2 0 0 0 2.8 0l7-7a2 2 0 0 0 0-2.8Z"></path><circle cx="7.7" cy="7.7" r="1.6"></circle>',
      trophy: '<path d="M8.5 21h7"></path><path d="M12 17.5V21"></path><path d="M7 4h10v4.5a5 5 0 0 1-10 0Z"></path><path d="M7 5H4.5A1.5 1.5 0 0 0 3 6.5 5 5 0 0 0 7 11"></path><path d="M17 5h2.5A1.5 1.5 0 0 1 21 6.5 5 5 0 0 1 17 11"></path>',
      building: '<rect x="4" y="2.5" width="16" height="19" rx="1.2"></rect><path d="M9.5 21.5V17h5v4.5"></path><path d="M8 6.5h.01"></path><path d="M16 6.5h.01"></path><path d="M8 10.5h.01"></path><path d="M16 10.5h.01"></path><path d="M8 14.5h.01"></path><path d="M16 14.5h.01"></path>',
      arrowLeftRight: '<path d="m17 3.5 4 4-4 4"></path><path d="M3 7.5h18"></path><path d="m7 20.5-4-4 4-4"></path><path d="M21 16.5H3"></path>',
      download: '<path d="M12 3v12.5"></path><path d="m7 11 5 5 5-5"></path><path d="M5 21h14"></path>',
      upload: '<path d="M12 21V8.5"></path><path d="m7 13 5-5 5 5"></path><path d="M5 3h14"></path>',
      chevronLeft: '<path d="m15 19-7-7 7-7"></path>',
      chevronRight: '<path d="m9 19 7-7-7-7"></path>',
      x: '<path d="M18.5 5.5 5.5 18.5"></path><path d="m5.5 5.5 13 13"></path>',
      shield: '<path d="M12 2.5 4.5 5.5v6c0 5.2 3.7 8.9 7.5 11.5 3.8-2.6 7.5-6.3 7.5-11.5v-6Z"></path>',
      arrowLeft: '<path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path>',
      backspace: '<path d="M9 5h11a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 20 19H9l-6.5-7Z"></path><path d="m14 9.5-5 5"></path><path d="m9 9.5 5 5"></path>',
      edit: '<path d="M12.5 5.5H5a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h11.5a2 2 0 0 0 2-2v-7.5"></path><path d="M18.4 3.6a2 2 0 0 1 2.8 2.8L11 16.5l-4 1 1-4Z"></path>',
      settings: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"></path>'
    };
    function icon(name, size = 18, strokeWidth = 2) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
    }
    function renderStaticIcons() {
      document.querySelectorAll('[data-icon]').forEach(el => {
        const size = Number(el.dataset.iconSize) || 18;
        el.innerHTML = icon(el.dataset.icon, size);
      });
    }
    
    // ==========================================
    // DESIGN SYSTEM: modal de confirmação e toasts (substituem confirm()/alert() nativos)
    // ==========================================
    let _confirmResolve = null;

    function showConfirm({ title = 'Confirmar', message = '', confirmText = 'Confirmar', cancelText = 'Cancelar', danger = true } = {}) {
      return new Promise((resolve) => {
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        const okBtn = document.getElementById('confirm-ok-btn');
        okBtn.textContent = confirmText;
        okBtn.className = 'btn ' + (danger ? 'btn-danger-solid' : 'btn-primary');
        const cancelBtn = document.getElementById('confirm-cancel-btn');
        cancelBtn.textContent = cancelText;
        _confirmResolve = resolve;
        document.getElementById('modal-confirm').classList.add('active');
        setTimeout(() => cancelBtn.focus(), 50);
      });
    }

    function resolveConfirm(result) {
      document.getElementById('modal-confirm').classList.remove('active');
      if (_confirmResolve) { _confirmResolve(result); _confirmResolve = null; }
    }

    function showToast(message, type = 'info', duration = 3200) {
      const container = document.getElementById('toast-container');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = 'toast ' + type;
      toast.setAttribute('role', 'status');
      toast.textContent = message;
      container.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 200);
      }, duration);
    }

    // ==========================================
    // ACESSIBILIDADE: fechar modais com Esc + mover o foco pro primeiro campo ao abrir
    // ==========================================
    function focusFirstField(containerId) {
      setTimeout(() => {
        const container = document.getElementById(containerId);
        if (!container) return;
        const focusable = container.querySelector('input:not([type="hidden"]), select, textarea, button');
        if (focusable) focusable.focus();
      }, 50);
    }

    const MODAL_ESCAPE_HANDLERS = {
      'modal-confirm': () => resolveConfirm(false),
      'modal-quick-tx': () => qtxClose(),
      'modal-transaction': () => closeTransactionModal(),
      'modal-account': () => closeAccountModal(),
      'modal-account-detail': () => document.getElementById('modal-account-detail').classList.remove('active'),
      'modal-investment': () => closeInvestmentModal(),
      'modal-investment-detail': () => document.getElementById('modal-investment-detail').classList.remove('active'),
      'modal-category': () => closeCategoryModal(),
      'modal-day-detail': () => document.getElementById('modal-day-detail').classList.remove('active'),
      'modal-vendor-detail': () => document.getElementById('modal-vendor-detail').classList.remove('active'),
      'modal-search': () => closeSearch()
    };

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      for (const id in MODAL_ESCAPE_HANDLERS) {
        const el = document.getElementById(id);
        if (el && el.classList.contains('active')) {
          MODAL_ESCAPE_HANDLERS[id]();
          return;
        }
      }
    });

    document.addEventListener('DOMContentLoaded', async () => {
      renderStaticIcons();
      await db.init();
      setupColorPickers();
      renderAll();
      await initLock();
      setupReportTabsScrollHint();
      registerServiceWorker();
    });

    // ==========================================
    // PWA: registro do Service Worker (cache offline do app shell)
    // ==========================================
    function registerServiceWorker() {
      if (!('serviceWorker' in navigator)) return;
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').catch(err => {
          console.error('Falha ao registrar o Service Worker:', err);
        });
      });
    }

    // Algumas abas de relatório passam do fim da tela sem indicação visual de que dá pra
    // arrastar; isso liga um gradiente na borda direita que some quando o fim da lista é alcançado.
    function updateReportTabsScrollHint() {
      const tabs = document.getElementById('report-tabs');
      const wrap = document.getElementById('report-tabs-wrap');
      if (!tabs || !wrap) return;
      const atEnd = tabs.scrollLeft + tabs.clientWidth >= tabs.scrollWidth - 4;
      wrap.classList.toggle('at-end', atEnd);
    }
    function setupReportTabsScrollHint() {
      const tabs = document.getElementById('report-tabs');
      if (!tabs) return;
      tabs.addEventListener('scroll', updateReportTabsScrollHint);
      window.addEventListener('resize', updateReportTabsScrollHint);
      updateReportTabsScrollHint();
    }

    function setupColorPickers() {
      ['account-color-picker', 'category-color-picker'].forEach(id => {
        const container = document.getElementById(id);
        if(!container) return;
        const hiddenInput = container.nextElementSibling;
        const currentColor = hiddenInput ? hiddenInput.value : COLORS[0];
        container.innerHTML = '';
        COLORS.forEach((color) => {
          const isSelected = color.toLowerCase() === (currentColor || '').toLowerCase();
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'color-option' + (isSelected ? ' selected' : '');
          btn.style.backgroundColor = color;
          btn.setAttribute('aria-label', 'Cor ' + color);
          btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
          btn.onclick = () => {
            container.querySelectorAll('.color-option').forEach(el => { el.classList.remove('selected'); el.setAttribute('aria-pressed', 'false'); });
            btn.classList.add('selected');
            btn.setAttribute('aria-pressed', 'true');
            hiddenInput.value = color;
          };
          container.appendChild(btn);
        });
      });
    }

    async function renderAll() {
      cachedAccounts = await db.getContas();
      cachedCategories = await db.getCategorias();
      cachedTransactions = await db.getTransacoes();
      cachedInvestments = await db.getInvestimentos();

      cachedTransactions.sort((a, b) => new Date(b.data) - new Date(a.data));

      calculateDashboardMetrics();
      renderAccounts();
      renderInvestments();
      renderVendorsSummary();
      updateAutocompleteSuggestions();
      populateFilterSelectors();
      renderTransactions();
      renderRankings();
    }

    // ==========================================
    // METRICAS DO DASHBOARD (MÊS CORRENTE 2026)
    // ==========================================
    function calculateDashboardMetrics() {
      let saldoDisponivel = cachedAccounts.reduce((sum, a) => sum + Number(a.saldoAtual), 0);
      let totalInvestido = cachedInvestments.reduce((sum, i) => sum + Number(i.patrimônioAtual), 0);
      let patrimonioTotal = saldoDisponivel + totalInvestido;

      const agora = getReferenceDate();
      const anoMesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
      const hojeStr = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;

      let receitasMes = 0;
      let despesasMes = 0;
      let rendimentosMes = 0;
      let entrouHoje = 0;
      let saiuHoje = 0;

      cachedTransactions.forEach(tx => {
        if (tx.data && tx.data.startsWith(anoMesAtual)) {
          if (tx.tipo === 'receita') receitasMes += Number(tx.valor);
          if (tx.tipo === 'despesa') despesasMes += Number(tx.valor);
          if (tx.tipo === 'rendimento') rendimentosMes += Number(tx.valor);
        }
        if (tx.data === hojeStr) {
          if (tx.tipo === 'receita') entrouHoje += Number(tx.valor);
          if (tx.tipo === 'despesa') saiuHoje += Number(tx.valor);
        }
      });

      let economiaMes = receitasMes - despesasMes;

      // Variação do patrimônio no mês: transferências e aportes só movem dinheiro entre
      // contas/investimentos já somados no total, então não alteram o patrimônio total.
      const variacaoPatrimonioMes = receitasMes - despesasMes + rendimentosMes;
      const patrimonioInicioMes = patrimonioTotal - variacaoPatrimonioMes;
      const pctVariacao = patrimonioInicioMes !== 0 ? (variacaoPatrimonioMes / Math.abs(patrimonioInicioMes)) * 100 : 0;

      animateNumberText(document.getElementById('db-total-patrimonio'), patrimonioTotal, formatCurrency);
      document.getElementById('db-saldo-disponivel').innerText = `${formatCurrency(saldoDisponivel)}`;
      document.getElementById('db-total-investido').innerText = `${formatCurrency(totalInvestido)}`;
      document.getElementById('db-receitas-mes').innerText = `+ ${formatCurrency(receitasMes)}`;
      document.getElementById('db-despeses-mes').innerText = `- ${formatCurrency(despesasMes)}`;
      document.getElementById('db-hoje-entrou').innerText = `+ ${formatCurrency(entrouHoje)}`;
      document.getElementById('db-hoje-saiu').innerText = `- ${formatCurrency(saiuHoje)}`;

      const changeEl = document.getElementById('db-patrimonio-change');
      changeEl.className = `change-chip ${pctVariacao >= 0 ? 'up' : 'down'}`;
      changeEl.innerHTML = `${icon(pctVariacao >= 0 ? 'trendingUp' : 'trendingDown', 12)} ${pctVariacao >= 0 ? '+' : ''}${pctVariacao.toFixed(1)}% este mês`;

      const econEl = document.getElementById('db-economia-mes');
      econEl.innerText = `${economiaMes >= 0 ? '+' : ''} ${formatCurrency(economiaMes)}`;

      const recentContainer = document.getElementById('dashboard-recent');
      recentContainer.innerHTML = '';
      if (cachedTransactions.length === 0) {
        recentContainer.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-secondary); font-size:13px;">Sem transações recentes.</div>`;
      } else {
        cachedTransactions.slice(0, 4).forEach(tx => recentContainer.appendChild(createTransactionCard(tx)));
      }
    }

    // ==========================================
    // PREENCHIMENTO AUTOMÁTICO (AUTOCOMPLETE)
    // ==========================================
    async function updateAutocompleteSuggestions() {
      const datalist = document.getElementById('vendors-suggestions');
      const ests = await db.getEstabelecimentos();
      datalist.innerHTML = ests.map(e => `<option value="${e.nome}">`).join('');
    }

    // ==========================================
    // TELA: ANÁLISE DE LOCAIS (ESTABELECIMENTOS)
    // ==========================================
    function renderVendorsSummary() {
      const container = document.getElementById('vendors-summary-list');
      container.innerHTML = '';

      const localMap = {};
      cachedTransactions.forEach(tx => {
        if (tx.estabelecimento && tx.estabelecimento.trim() !== '') {
          const nomeKey = tx.estabelecimento.trim();
          if (!localMap[nomeKey]) {
            localMap[nomeKey] = { totalGasto: 0, comprasQtd: 0, transacoes: [] };
          }
          localMap[nomeKey].transacoes.push(tx);
          if (tx.tipo === 'despesa') {
            localMap[nomeKey].totalGasto += Number(tx.valor);
            localMap[nomeKey].comprasQtd++;
          }
        }
      });

      const locaisOrdenados = Object.keys(localMap).sort((a,b) => localMap[b].totalGasto - localMap[a].totalGasto);

      if (locaisOrdenados.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-secondary);">Nenhum estabelecimento detectado.</div>`;
        return;
      }

      locaisOrdenados.forEach(nome => {
        const dados = localMap[nome];
        const card = document.createElement('div');
        card.className = 'card account-card';
        card.onclick = () => openVendorDetailModal(nome, dados);
        card.innerHTML = `
          <div class="card-icon-wrapper" style="background: var(--bg-tertiary); color: var(--text-primary)">${icon('mapPin', 20)}</div>
          <div class="card-info-content">
            <div class="card-info-name">${escapeHtml(nome)}</div>
            <div class="card-info-subtitle">${dados.comprasQtd} compras registradas</div>
          </div>
          <div class="card-side-value value-negative">${formatCurrency(dados.totalGasto)}</div>
        `;
        container.appendChild(card);
      });
    }

    function openVendorDetailModal(nome, dados) {
      const despesas = dados.transacoes.filter(t => t.tipo === 'despesa').sort((a, b) => new Date(b.data) - new Date(a.data));
      const media = dados.comprasQtd > 0 ? dados.totalGasto / dados.comprasQtd : 0;
      const primeira = despesas.length ? despesas[despesas.length - 1] : null;
      const ultima = despesas.length ? despesas[0] : null;
      const fmtData = (d) => d ? new Date(d.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '—';

      document.getElementById('vendor-detail-icon').innerHTML = icon('mapPin', 22);
      document.getElementById('vendor-detail-title').innerText = nome;
      document.getElementById('vendor-detail-total').innerText = formatCurrency(dados.totalGasto);
      document.getElementById('vendor-detail-media').innerText = formatCurrency(media);
      document.getElementById('vendor-detail-primeira').innerText = fmtData(primeira);
      document.getElementById('vendor-detail-ultima').innerText = fmtData(ultima);

      const listContainer = document.getElementById('vendor-detail-tx-list');
      listContainer.innerHTML = '';
      if (despesas.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center; padding:16px; color:var(--text-secondary); font-size:13px;">Nenhuma despesa registrada neste local.</div>`;
      } else {
        despesas.forEach(tx => {
          const row = document.createElement('div');
          row.style.cssText = 'display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border-color); font-size:14px;';
          row.innerHTML = `<span style="color:var(--text-secondary)">${new Date(tx.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</span><span class="value-negative" style="font-weight:700;">- ${formatCurrency(Number(tx.valor))}</span>`;
          listContainer.appendChild(row);
        });
      }
      document.getElementById('modal-vendor-detail').classList.add('active');
    }

    function openAccountDetailModal(acc) {
      const movimentacoes = cachedTransactions.filter(t => t.contaId === acc.id || t.contaDestinoId === acc.id);
      const ultima = movimentacoes[0]; // cachedTransactions já vem ordenado do mais recente pro mais antigo

      const iconEl = document.getElementById('account-detail-icon');
      iconEl.innerHTML = escapeHtml(acc.icone);
      iconEl.style.background = acc.cor + '33';
      iconEl.style.color = acc.cor;
      document.getElementById('account-detail-title').innerText = acc.nome;
      const saldoEl = document.getElementById('account-detail-saldo');
      saldoEl.innerText = formatCurrency(acc.saldoAtual);
      saldoEl.style.color = acc.cor;
      document.getElementById('account-detail-count').innerText = movimentacoes.length;
      document.getElementById('account-detail-ultima').innerText = ultima ? formatRelativeDate(ultima.data) : '—';

      const editBtn = document.getElementById('account-detail-edit-btn');
      editBtn.onclick = () => {
        document.getElementById('modal-account-detail').classList.remove('active');
        openAccountModal(acc);
      };

      const listContainer = document.getElementById('account-detail-tx-list');
      listContainer.innerHTML = '';
      if (movimentacoes.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center; padding:16px; color:var(--text-secondary); font-size:13px;">Nenhuma movimentação nesta conta ainda.</div>`;
      } else {
        movimentacoes.forEach(tx => {
          listContainer.appendChild(wrapTransactionCardWithSwipe(createTransactionCard(tx, true), tx));
        });
      }

      document.getElementById('modal-account-detail').classList.add('active');
      focusFirstField('modal-account-detail');
    }

    // ==========================================
    // SISTEMA DE RANKINGS COM FILTROS AVANÇADOS
    // ==========================================
    function toggleCustomDates() {
      const timeframe = document.getElementById('rank-timeframe').value;
      document.getElementById('rank-custom-dates').style.display = timeframe === 'personalizado' ? 'grid' : 'none';
    }

    function switchRankGroup(group) {
      currentRankGroup = group;
      document.getElementById('btn-rank-vendor').classList.toggle('active', group === 'estabelecimento');
      document.getElementById('btn-rank-cat').classList.toggle('active', group === 'categoria');
      renderRankings();
    }

    function getDatesFromTimeframe(timeframe) {
      const agora = new Date(2026, 6, 13); // Fixado na data de referência do sistema: 13 de Julho de 2026
      let inicio = new Date(agora);
      let fim = new Date(agora);

      if (timeframe === 'semana') {
        const diaSemana = agora.getDay();
        inicio.setDate(agora.getDate() - diaSemana);
        fim.setDate(inicio.getDate() + 6);
      } else if (timeframe === 'mes') {
        inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
        fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);
      } else if (timeframe === 'trimestre') {
        const trimestreAtual = Math.floor(agora.getMonth() / 3);
        inicio = new Date(agora.getFullYear(), trimestreAtual * 3, 1);
        fim = new Date(agora.getFullYear(), (trimestreAtual + 1) * 3, 0);
      } else if (timeframe === 'ano') {
        inicio = new Date(agora.getFullYear(), 0, 1);
        fim = new Date(agora.getFullYear(), 11, 31);
      } else if (timeframe === 'personalizado') {
        const startVal = document.getElementById('rank-start-date').value;
        const endVal = document.getElementById('rank-end-date').value;
        inicio = startVal ? new Date(startVal + 'T00:00:00') : new Date(0);
        fim = endVal ? new Date(endVal + 'T23:59:59') : new Date(8640000000000000);
      }
      return { inicio, fim };
    }

    function renderRankings() {
      const container = document.getElementById('rankings-result-list');
      container.innerHTML = '';

      const timeframe = document.getElementById('rank-timeframe').value;
      const metric = document.getElementById('rank-metric').value;
      const { inicio, fim } = getDatesFromTimeframe(timeframe);

      const mapping = {};

      cachedTransactions.forEach(tx => {
        if (tx.tipo !== 'despesa') return;
        const txDate = new Date(tx.data + 'T00:00:00');
        if (txDate < inicio || txDate > fim) return;

        let key = '';
        if (currentRankGroup === 'estabelecimento') {
          key = tx.estabelecimento ? tx.estabelecimento.trim() : 'Não Identificado';
        } else {
          const cat = cachedCategories.find(c => c.id === tx.categoriaId);
          key = cat ? `${cat.icone} ${cat.nome}` : '🏷️ Sem Categoria';
        }

        if (!mapping[key]) mapping[key] = { valor: 0, quantidade: 0 };
        mapping[key].valor += Number(tx.valor);
        mapping[key].quantidade++;
      });

      const listagem = Object.keys(mapping).map(key => ({ name: key, ...mapping[key] }));

      if (metric === 'valor') {
        listagem.sort((a, b) => b.valor - a.valor);
      } else {
        listagem.sort((a, b) => b.quantidade - a.quantidade);
      }

      if (listagem.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-secondary); font-size:13px;">Nenhum dado encontrado para o período.</div>`;
        return;
      }

      listagem.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'ranking-item';
        itemEl.innerHTML = `
          <div style="display: flex; align-items: center; min-width: 0;">
            <div class="ranking-badge">${index + 1}</div>
            <div style="font-weight:700; font-size:14px;" class="card-info-name">${escapeHtml(item.name)}</div>
          </div>
          <div style="text-align: right; flex-shrink: 0; margin-left: 10px;">
            <div style="font-weight: 800; font-size: 14px;" class="value-negative">${formatCurrency(item.valor)}</div>
            <div style="font-size: 11px; color: var(--text-secondary);">${item.quantidade} compras</div>
          </div>
        `;
        container.appendChild(itemEl);
      });
    }

    // ==========================================
    // TRANSAÇÕES & FORMULÁRIO DINGMICO
    // ==========================================
    function setTransactionType(type, btn) {
      document.getElementById('tx-type').value = type;
      document.querySelectorAll('.segment-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const grpOrigin = document.getElementById('group-tx-origin');
      const grpDest = document.getElementById('group-tx-destination');
      const grpInv = document.getElementById('group-tx-investment');
      const grpCat = document.getElementById('group-tx-category');
      const grpVendor = document.getElementById('group-tx-vendor');
      const lblOrigin = document.getElementById('label-tx-origin');

      document.getElementById('tx-account').required = false;
      document.getElementById('tx-account-dest').required = false;
      document.getElementById('tx-investment').required = false;
      document.getElementById('tx-category').required = false;

      if (type === 'despesa' || type === 'receita') {
        grpOrigin.style.display = 'block'; lblOrigin.innerText = 'Conta'; document.getElementById('tx-account').required = true;
        grpDest.style.display = 'none'; grpInv.style.display = 'none';
        grpCat.style.display = 'block'; document.getElementById('tx-category').required = true;
        grpVendor.style.display = 'block';
      } else if (type === 'transferencia') {
        grpOrigin.style.display = 'block'; lblOrigin.innerText = 'Conta Origem'; document.getElementById('tx-account').required = true;
        grpDest.style.display = 'block'; document.getElementById('tx-account-dest').required = true;
        grpInv.style.display = 'none'; grpCat.style.display = 'none'; grpVendor.style.display = 'none';
      } else if (type === 'aporte') {
        grpOrigin.style.display = 'block'; lblOrigin.innerText = 'Conta Origem'; document.getElementById('tx-account').required = true;
        grpDest.style.display = 'none';
        grpInv.style.display = 'block'; document.getElementById('tx-investment').required = true;
        grpCat.style.display = 'none'; grpVendor.style.display = 'none';
      } else if (type === 'rendimento') {
        grpOrigin.style.display = 'none'; grpDest.style.display = 'none';
        grpInv.style.display = 'block'; document.getElementById('tx-investment').required = true;
        grpCat.style.display = 'none'; grpVendor.style.display = 'none';
      }
    }

    async function saveTransaction(e) {
      e.preventDefault();
      const id = document.getElementById('tx-id').value;
      const type = document.getElementById('tx-type').value;

      const data = {
        valor: Number(document.getElementById('tx-amount').value),
        tipo: type,
        data: document.getElementById('tx-date').value,
        descricao: document.getElementById('tx-description').value || null,
        contaId: (type !== 'rendimento') ? Number(document.getElementById('tx-account').value) : null,
        contaDestinoId: (type === 'transferencia') ? Number(document.getElementById('tx-account-dest').value) : null,
        investimentoId: (type === 'aporte' || type === 'rendimento') ? Number(document.getElementById('tx-investment').value) : null,
        categoriaId: (type === 'despesa' || type === 'receita') ? Number(document.getElementById('tx-category').value) : null,
        estabelecimento: (type === 'despesa' || type === 'receita') ? (document.getElementById('tx-vendor').value || null) : null
      };

      if (type === 'transferencia' && data.contaId === data.contaDestinoId) {
        showToast('As contas devem ser diferentes.', 'error'); return;
      }

      if (data.estabelecimento && data.estabelecimento.trim() !== '') {
        const ests = await db.getEstabelecimentos();
        if (!ests.some(e => e.nome.toLowerCase() === data.estabelecimento.trim().toLowerCase())) {
          await db.addEstabelecimento({ nome: data.estabelecimento.trim() });
        }
      }

      if (id) { data.id = Number(id); await db.updateTransacao(data); }
      else { await db.addTransacao(data); }

      closeTransactionModal();
      await renderAll();
    }

    function createTransactionCard(tx, includeDate = true) {
      const acc = cachedAccounts.find(a => a.id === tx.contaId);
      const accDest = cachedAccounts.find(a => a.id === tx.contaDestinoId);
      const inv = cachedInvestments.find(i => i.id === tx.investimentoId);
      const cat = cachedCategories.find(c => c.id === tx.categoriaId);
      
      let visualColor = '#8B949E'; let visualIcon = icon('shoppingBag', 20); let visualSign = '-'; let visualClass = 'value-negative';
      let nomeExibicao = tx.descricao || tx.estabelecimento || 'Movimentação';
      const dataLabel = new Date(tx.data + 'T00:00:00').toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'});
      let legendaParts = includeDate ? [dataLabel] : [];

      if (tx.tipo === 'receita') {
        visualColor = cat ? cat.cor : '#198754'; visualIcon = cat ? escapeHtml(cat.icone) : icon('wallet', 20); visualSign = '+'; visualClass = 'value-positive';
        legendaParts.push(escapeHtml(acc ? acc.nome : ''));
      } else if (tx.tipo === 'despesa') {
        visualColor = cat ? cat.cor : '#DC3545'; visualIcon = cat ? escapeHtml(cat.icone) : icon('shoppingBag', 20);
        legendaParts.push(escapeHtml(acc ? acc.nome : ''));
      } else if (tx.tipo === 'transferencia') {
        visualColor = '#0F62FE'; visualIcon = icon('arrowLeftRight', 20); visualSign = ''; visualClass = '';
        nomeExibicao = 'Transferência'; legendaParts.push(`${escapeHtml(acc?.nome)} ➔ ${escapeHtml(accDest?.nome)}`);
      } else if (tx.tipo === 'aporte') {
        visualColor = '#6610F2'; visualIcon = icon('wallet', 20); visualSign = ''; visualClass = '';
        nomeExibicao = 'Aporte'; legendaParts.push(`${escapeHtml(acc?.nome)} ➔ ${escapeHtml(inv?.nome)}`);
      } else if (tx.tipo === 'rendimento') {
        visualColor = '#39D353'; visualIcon = icon('sparkles', 20); visualSign = '+'; visualClass = 'value-positive';
        nomeExibicao = 'Rendimento'; legendaParts.push(`Ativo: ${escapeHtml(inv?.nome)}`);
      } else if (tx.tipo === 'ajuste') {
        const positivo = Number(tx.valor) >= 0;
        visualColor = positivo ? '#39D353' : '#FF5C6C'; visualIcon = icon('settings', 20);
        visualSign = positivo ? '+' : '-'; visualClass = positivo ? 'value-positive' : 'value-negative';
        nomeExibicao = 'Ajuste de saldo'; legendaParts.push(escapeHtml(acc ? acc.nome : ''));
      }
      const legenda = legendaParts.filter(Boolean).join(' • ');

      const card = document.createElement('div');
      card.className = 'card transaction-card';
      card.onclick = (tx.tipo === 'ajuste') ? null : () => openTransactionModal(tx);
      card.innerHTML = `
        <div class="card-icon-wrapper" style="background: ${visualColor}33; color: ${visualColor}">${visualIcon}</div>
        <div class="card-info-content">
          <div class="card-info-name">${escapeHtml(nomeExibicao)}</div>
          <div class="card-info-subtitle">${legenda}</div>
        </div>
        <div class="card-side-value ${visualClass}">
          ${visualSign} ${formatCurrency(Math.abs(Number(tx.valor)))}
        </div>
      `;
      return card;
    }

    async function openTransactionModal(tx = null, presetTipo = null) {
      const modal = document.getElementById('modal-transaction');
      const form = document.getElementById('form-transaction');
      const btnDel = document.getElementById('btn-delete-tx');

      document.getElementById('tx-account').innerHTML = cachedAccounts.map(a => `<option value="${a.id}">${a.nome}</option>`).join('');
      document.getElementById('tx-account-dest').innerHTML = cachedAccounts.map(a => `<option value="${a.id}">${a.nome}</option>`).join('');
      document.getElementById('tx-investment').innerHTML = cachedInvestments.map(i => `<option value="${i.id}">${i.nome}</option>`).join('');
      document.getElementById('tx-category').innerHTML = cachedCategories.map(c => `<option value="${c.id}">${c.icone} ${c.nome}</option>`).join('');

      form.reset(); document.getElementById('tx-id').value = ''; btnDel.style.display = 'none';
      document.getElementById('tx-date').value = getReferenceDate().toISOString().split('T')[0];

      if(tx) {
        document.getElementById('tx-id').value = tx.id;
        document.getElementById('tx-amount').value = tx.valor;
        if(tx.contaId) document.getElementById('tx-account').value = tx.contaId;
        if(tx.contaDestinoId) document.getElementById('tx-account-dest').value = tx.contaDestinoId;
        if(tx.investimentoId) document.getElementById('tx-investment').value = tx.investimentoId;
        if(tx.categoriaId) document.getElementById('tx-category').value = tx.categoriaId;
        document.getElementById('tx-vendor').value = tx.estabelecimento || '';
        document.getElementById('tx-description').value = tx.descricao || '';
        document.getElementById('tx-date').value = tx.data;
        btnDel.style.display = 'block';

        const btnSeg = document.querySelector(`.segment-btn[data-tipo="${tx.tipo}"]`);
        if(btnSeg) setTransactionType(tx.tipo, btnSeg);
      } else {
        const tipoInicial = presetTipo || 'despesa';
        const btnSeg = document.querySelector(`.segment-btn[data-tipo="${tipoInicial}"]`) || document.querySelector('.segment-btn');
        setTransactionType(tipoInicial, btnSeg);
      }
      modal.classList.add('active');
      focusFirstField('modal-transaction');
    }

    function toggleFabMenu() {
      const isOpen = document.getElementById('fab-menu').classList.toggle('active');
      document.getElementById('fab-backdrop').classList.toggle('active', isOpen);
      document.getElementById('fab-main').classList.toggle('open', isOpen);
    }
    function closeFabMenu() {
      document.getElementById('fab-menu').classList.remove('active');
      document.getElementById('fab-backdrop').classList.remove('active');
      document.getElementById('fab-main').classList.remove('open');
    }
    // ==========================================
    // FLUXO DE LANÇAMENTO RÁPIDO (Valor -> Tipo -> Categoria -> Detalhes)
    // ==========================================
    const QTX_TYPES = [
      { tipo: 'despesa', label: 'Despesa', icon: 'trendingDown', color: '#FF5C6C' },
      { tipo: 'receita', label: 'Receita', icon: 'trendingUp', color: '#22C55E' },
      { tipo: 'transferencia', label: 'Transferência', icon: 'arrowLeftRight', color: '#0F62FE' },
      { tipo: 'aporte', label: 'Aporte', icon: 'wallet', color: '#6610F2' },
      { tipo: 'rendimento', label: 'Rendimento', icon: 'sparkles', color: '#FFC107' }
    ];
    let qtx = null;

    function openQuickTx(presetTipo = null) {
      closeFabMenu();
      qtx = {
        tipo: presetTipo,
        presetTipo: !!presetTipo,
        cents: '',
        valor: 0,
        categoriaId: null,
        contaId: null,
        contaDestinoId: null,
        investimentoId: null,
        estabelecimento: '',
        descricao: '',
        data: getReferenceDate().toISOString().slice(0, 10)
      };
      document.getElementById('modal-quick-tx').classList.add('active');
      document.getElementById('qtx-amount-display').innerText = formatCurrency(0);
      document.getElementById('qtx-valor-continue').disabled = true;
      qtxShowStep('valor');
    }

    function qtxClose() {
      document.getElementById('modal-quick-tx').classList.remove('active');
      qtx = null;
    }

    function qtxStepsForCurrentTipo() {
      const needsCategoria = qtx.tipo === 'despesa' || qtx.tipo === 'receita';
      const steps = ['valor'];
      if (!qtx.presetTipo) steps.push('tipo');
      if (needsCategoria) steps.push('categoria');
      steps.push('detalhes');
      return steps;
    }

    function qtxShowStep(step) {
      qtx.step = step;
      document.querySelectorAll('.qtx-step').forEach(s => s.classList.remove('active'));
      document.getElementById('qtx-step-' + step).classList.add('active');
      focusFirstField('qtx-step-' + step);

      const steps = qtxStepsForCurrentTipo();
      const idx = steps.indexOf(step);
      document.getElementById('qtx-dots').innerHTML = steps.map((s, i) =>
        `<div class="qtx-dot ${i === idx ? 'active' : (i < idx ? 'done' : '')}"></div>`
      ).join('');
      document.querySelector('.qtx-back').classList.toggle('hidden', idx === 0);

      if (step === 'tipo') qtxRenderTypeList();
      else if (step === 'categoria') qtxRenderCategoryGrid();
      else if (step === 'detalhes') qtxRenderDetailFields();
    }

    function qtxBack() {
      const steps = qtxStepsForCurrentTipo();
      const idx = steps.indexOf(qtx.step);
      if (idx > 0) qtxShowStep(steps[idx - 1]); else qtxClose();
    }

    function qtxNext() {
      const steps = qtxStepsForCurrentTipo();
      const idx = steps.indexOf(qtx.step);
      if (idx < steps.length - 1) qtxShowStep(steps[idx + 1]);
    }

    // --- Passo 1: valor (teclado numérico, dígitos preenchem a partir dos centavos) ---
    function qtxUpdateAmountDisplay() {
      const cents = qtx.cents.replace(/^0+/, '') || '0';
      const value = Number(cents) / 100;
      document.getElementById('qtx-amount-display').innerText = formatCurrency(value);
      document.getElementById('qtx-valor-continue').disabled = value <= 0;
    }
    function qtxDigit(d) {
      if (qtx.cents.length >= 9) return;
      qtx.cents += d;
      qtxUpdateAmountDisplay();
    }
    function qtxBackspace() {
      qtx.cents = qtx.cents.slice(0, -1);
      qtxUpdateAmountDisplay();
    }
    function qtxGoToTipo() {
      const cents = qtx.cents.replace(/^0+/, '') || '0';
      const value = Number(cents) / 100;
      if (value <= 0) return;
      qtx.valor = value;
      qtxNext();
    }

    // --- Passo 2: tipo ---
    function qtxRenderTypeList() {
      const container = document.getElementById('qtx-type-list');
      container.innerHTML = '';
      QTX_TYPES.forEach(t => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'qtx-type-btn' + (qtx.tipo === t.tipo ? ' selected' : '');
        btn.style.setProperty('--type-color', t.color);
        btn.innerHTML = `${icon(t.icon, 20)}<span>${t.label}</span>`;
        btn.onclick = () => { qtx.tipo = t.tipo; qtxNext(); };
        container.appendChild(btn);
      });
    }

    // --- Passo 3: categoria (só para despesa/receita) ---
    function qtxRenderCategoryGrid() {
      const container = document.getElementById('qtx-category-grid');
      container.innerHTML = '';
      if (cachedCategories.length === 0) {
        container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:20px; color:var(--text-secondary); font-size:13px;">Nenhuma categoria cadastrada. Crie uma em Mais → Categorias.</div>`;
        return;
      }
      cachedCategories.forEach(cat => {
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'qtx-category-tile' + (qtx.categoriaId === cat.id ? ' selected' : '');
        tile.innerHTML = `<span class="qtx-category-tile-icon">${escapeHtml(cat.icone)}</span><span class="qtx-category-tile-name">${escapeHtml(cat.nome)}</span>`;
        tile.onclick = () => { qtx.categoriaId = cat.id; qtxNext(); };
        container.appendChild(tile);
      });
    }

    // --- Passo 4: detalhes (campos variam conforme o tipo) ---
    function qtxRenderDetailFields() {
      const container = document.getElementById('qtx-detail-fields');
      const accOptions = cachedAccounts.map(a => `<option value="${a.id}">${escapeHtml(a.nome)}</option>`).join('');
      const invOptions = cachedInvestments.map(i => `<option value="${i.id}">${escapeHtml(i.nome)}</option>`).join('');

      let html = '';
      if (qtx.tipo === 'despesa' || qtx.tipo === 'receita') {
        html += `<div class="form-group"><label class="form-label">Conta</label><select id="qtx-conta" class="form-input">${accOptions}</select></div>`;
        html += `<div class="form-group"><label class="form-label">Estabelecimento / Local</label><input type="text" id="qtx-estabelecimento" class="form-input" placeholder="Opcional" list="vendors-suggestions"></div>`;
      } else if (qtx.tipo === 'transferencia') {
        html += `<div class="form-group"><label class="form-label">Conta Origem</label><select id="qtx-conta" class="form-input">${accOptions}</select></div>`;
        html += `<div class="form-group"><label class="form-label">Conta Destino</label><select id="qtx-conta-dest" class="form-input">${accOptions}</select></div>`;
      } else if (qtx.tipo === 'aporte') {
        html += `<div class="form-group"><label class="form-label">Conta Origem</label><select id="qtx-conta" class="form-input">${accOptions}</select></div>`;
        html += `<div class="form-group"><label class="form-label">Ativo de Investimento</label><select id="qtx-investimento" class="form-input">${invOptions}</select></div>`;
      } else if (qtx.tipo === 'rendimento') {
        html += `<div class="form-group"><label class="form-label">Ativo de Investimento</label><select id="qtx-investimento" class="form-input">${invOptions}</select></div>`;
      }
      html += `<div class="form-group"><label class="form-label">Descrição Breve</label><input type="text" id="qtx-descricao" class="form-input" placeholder="Opcional"></div>`;
      html += `<div class="form-group"><label class="form-label">Data</label><input type="date" id="qtx-data" class="form-input"></div>`;
      container.innerHTML = html;

      const contaSel = document.getElementById('qtx-conta');
      const contaDestSel = document.getElementById('qtx-conta-dest');
      const invSel = document.getElementById('qtx-investimento');
      const estInput = document.getElementById('qtx-estabelecimento');
      const descInput = document.getElementById('qtx-descricao');
      const dataInput = document.getElementById('qtx-data');

      // Restaura seleções feitas anteriormente (caso o usuário volte e avance de novo)
      if (contaSel) { if (qtx.contaId) contaSel.value = qtx.contaId; else qtx.contaId = Number(contaSel.value) || null; contaSel.onchange = () => qtx.contaId = Number(contaSel.value); }
      if (contaDestSel) { if (qtx.contaDestinoId) contaDestSel.value = qtx.contaDestinoId; contaDestSel.onchange = () => qtx.contaDestinoId = Number(contaDestSel.value); }
      if (invSel) { if (qtx.investimentoId) invSel.value = qtx.investimentoId; else qtx.investimentoId = Number(invSel.value) || null; invSel.onchange = () => qtx.investimentoId = Number(invSel.value); }
      if (estInput) { estInput.value = qtx.estabelecimento || ''; estInput.oninput = () => qtx.estabelecimento = estInput.value; }
      if (descInput) { descInput.value = qtx.descricao || ''; descInput.oninput = () => qtx.descricao = descInput.value; }
      dataInput.value = qtx.data;
      dataInput.onchange = () => qtx.data = dataInput.value;
    }

    async function qtxSave() {
      const tipo = qtx.tipo;
      const contaEl = document.getElementById('qtx-conta');
      const contaDestEl = document.getElementById('qtx-conta-dest');
      const invEl = document.getElementById('qtx-investimento');
      const estEl = document.getElementById('qtx-estabelecimento');
      const descEl = document.getElementById('qtx-descricao');
      const dataEl = document.getElementById('qtx-data');

      if (contaEl && !contaEl.value) { showToast('Selecione uma conta.', 'error'); return; }
      if (contaDestEl && !contaDestEl.value) { showToast('Selecione a conta destino.', 'error'); return; }
      if (invEl && !invEl.value) { showToast('Selecione um ativo de investimento.', 'error'); return; }
      if (contaEl && contaDestEl && contaEl.value === contaDestEl.value) { showToast('As contas de origem e destino devem ser diferentes.', 'error'); return; }
      if (!dataEl.value) { showToast('Selecione uma data.', 'error'); return; }
      if ((tipo === 'despesa' || tipo === 'receita') && !qtx.categoriaId) { showToast('Selecione uma categoria.', 'error'); qtxShowStep('categoria'); return; }

      const data = {
        valor: qtx.valor,
        tipo,
        data: dataEl.value,
        descricao: descEl.value.trim() || null,
        contaId: contaEl ? Number(contaEl.value) : null,
        contaDestinoId: contaDestEl ? Number(contaDestEl.value) : null,
        investimentoId: invEl ? Number(invEl.value) : null,
        categoriaId: (tipo === 'despesa' || tipo === 'receita') ? qtx.categoriaId : null,
        estabelecimento: (estEl && estEl.value.trim()) ? estEl.value.trim() : null
      };

      if (data.estabelecimento) {
        const ests = await db.getEstabelecimentos();
        if (!ests.some(e => e.nome.toLowerCase() === data.estabelecimento.toLowerCase())) {
          await db.addEstabelecimento({ nome: data.estabelecimento });
        }
      }

      await db.addTransacao(data);
      qtxClose();
      await renderAll();
    }

    async function openFromFab(tipo) {
      openQuickTx(tipo);
    }

    function closeTransactionModal() { document.getElementById('modal-transaction').classList.remove('active'); }

    async function deleteTransactionById(id) {
      const ok = await showConfirm({ title: 'Excluir transação?', message: 'Essa ação não pode ser desfeita.', confirmText: 'Excluir' });
      if (!ok) return;
      await db.deleteTransacao(id);
      await renderAll();
    }

    async function duplicateTransactionById(id) {
      const tx = cachedTransactions.find(t => t.id === id);
      if (!tx) return;
      const hoje = getReferenceDate();
      const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
      const clone = {
        valor: tx.valor, tipo: tx.tipo, data: hojeStr, descricao: tx.descricao,
        contaId: tx.contaId, contaDestinoId: tx.contaDestinoId,
        investimentoId: tx.investimentoId, categoriaId: tx.categoriaId, estabelecimento: tx.estabelecimento
      };
      await db.addTransacao(clone);
      await renderAll();
    }

    // Gesto de arrastar (revela Editar à direita / Excluir à esquerda) e pressionar (duplica).
    // touch-action:pan-y no elemento deixa o scroll vertical da página funcionando normalmente;
    // só passamos a controlar o gesto quando o movimento é predominantemente horizontal.
    // Dica de descoberta do gesto de swipe: só faz sentido em telas touch, e some
    // permanentemente após ser dispensada ou após o usuário usar o gesto pela 1ª vez.
    function isTouchDevice() { return 'ontouchstart' in window || navigator.maxTouchPoints > 0; }
    function updateSwipeHintVisibility() {
      const hint = document.getElementById('swipe-hint');
      if (!hint) return;
      const seen = localStorage.getItem('mt_swipe_hint_dismissed') === '1';
      hint.style.display = (isTouchDevice() && !seen && cachedTransactions.length > 0) ? 'flex' : 'none';
    }
    function dismissSwipeHint() {
      localStorage.setItem('mt_swipe_hint_dismissed', '1');
      const hint = document.getElementById('swipe-hint');
      if (hint) hint.style.display = 'none';
    }

    function attachSwipeActions(contentEl, { onEdit, onDelete, onDuplicate }) {
      let startX = 0, startY = 0, currentX = 0, dragging = false, axis = null, longPressTimer = null, longPressFired = false;
      const THRESHOLD = 64;

      const onStart = (e) => {
        const t = e.touches ? e.touches[0] : e;
        startX = t.clientX; startY = t.clientY; currentX = 0; dragging = true; axis = null; longPressFired = false;
        contentEl.classList.add('dragging');
        longPressTimer = setTimeout(() => {
          if (axis === null) {
            longPressFired = true;
            contentEl.style.transform = 'scale(0.96)';
            if (navigator.vibrate) navigator.vibrate(15);
            setTimeout(() => { contentEl.style.transform = ''; }, 150);
            dismissSwipeHint();
            onDuplicate && onDuplicate();
            dragging = false;
          }
        }, 550);
      };
      const onMove = (e) => {
        if (!dragging) return;
        const t = e.touches ? e.touches[0] : e;
        const dx = t.clientX - startX, dy = t.clientY - startY;
        if (axis === null && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
          axis = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
          clearTimeout(longPressTimer);
        }
        if (axis === 'h') {
          currentX = Math.max(-100, Math.min(100, dx));
          contentEl.style.transform = `translateX(${currentX}px)`;
          if (e.cancelable) e.preventDefault();
        }
      };
      const onEnd = () => {
        clearTimeout(longPressTimer);
        if (!dragging) return;
        dragging = false;
        contentEl.classList.remove('dragging');
        if (!longPressFired) {
          if (currentX > THRESHOLD) { dismissSwipeHint(); onEdit && onEdit(); }
          else if (currentX < -THRESHOLD) { dismissSwipeHint(); onDelete && onDelete(); }
          contentEl.style.transform = '';
        }
        currentX = 0; axis = null;
      };

      contentEl.addEventListener('touchstart', onStart, { passive: true });
      contentEl.addEventListener('touchmove', onMove, { passive: false });
      contentEl.addEventListener('touchend', onEnd);
      contentEl.addEventListener('touchcancel', onEnd);
    }

    function wrapTransactionCardWithSwipe(card, tx) {
      const isAjuste = tx.tipo === 'ajuste';
      const wrap = document.createElement('div');
      wrap.className = 'swipe-wrap';
      const editActionHtml = isAjuste ? '' : `<div class="swipe-action edit">${icon('edit', 18)}<span>Editar</span></div>`;
      wrap.innerHTML = `<div class="swipe-actions">${editActionHtml}<div class="swipe-action delete">${icon('x', 18)}<span>Excluir</span></div></div>`;
      const fg = document.createElement('div');
      fg.className = 'swipe-foreground';
      fg.appendChild(card);
      wrap.appendChild(fg);
      attachSwipeActions(fg, {
        onEdit: isAjuste ? null : () => openTransactionModal(tx),
        onDelete: () => deleteTransactionById(tx.id),
        onDuplicate: isAjuste ? null : () => duplicateTransactionById(tx.id)
      });
      return wrap;
    }

    // Contador animado (ex.: valor de patrimônio subindo/descendo até o novo total).
    function animateNumberText(el, toValue, formatter, duration = 600) {
      if (!el) return;
      const fromValue = el.dataset.rawValue !== undefined ? Number(el.dataset.rawValue) : 0;
      el.dataset.rawValue = toValue;
      const start = performance.now();
      function step(now) {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.innerText = formatter(fromValue + (toValue - fromValue) * eased);
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    async function deleteTransaction() {
      const ok = await showConfirm({ title: 'Excluir transação?', message: 'Essa ação não pode ser desfeita.', confirmText: 'Excluir' });
      if (!ok) return;
      await db.deleteTransacao(document.getElementById('tx-id').value);
      closeTransactionModal();
      await renderAll();
    }

    // ==========================================
    // SEÇÕES AUXILIARES E GESTÃO INTERNA
    // ==========================================
    function formatRelativeDate(dateStr) {
      if (!dateStr) return '—';
      const hoje = getReferenceDate();
      const [y, m, d] = dateStr.split('-').map(Number);
      const data = new Date(y, m - 1, d);
      const diffDias = Math.round((hoje.setHours(0,0,0,0) - data.setHours(0,0,0,0)) / 86400000);
      if (diffDias === 0) return 'hoje';
      if (diffDias === 1) return 'ontem';
      if (diffDias > 1) return `${diffDias} dias atrás`;
      return data.toLocaleDateString('pt-BR');
    }

    function renderAccounts() {
      const list = document.getElementById('accounts-list'); list.innerHTML = '';
      if(cachedAccounts.length === 0) list.innerHTML = `<div style="text-align:center; padding:15px; color:var(--text-secondary); font-size:12px;">Sem contas.</div>`;
      const totalSaldoContas = cachedAccounts.reduce((sum, a) => sum + Math.max(Number(a.saldoAtual), 0), 0);
      cachedAccounts.forEach(acc => {
        const movimentacoes = cachedTransactions.filter(t => t.contaId === acc.id || t.contaDestinoId === acc.id);
        const ultima = movimentacoes[0]; // cachedTransactions já vem ordenado do mais recente pro mais antigo
        const pct = totalSaldoContas > 0 ? Math.max(0, Math.min(100, (Number(acc.saldoAtual) / totalSaldoContas) * 100)) : 0;

        const card = document.createElement('div'); card.className = 'card account-card-wrap'; card.onclick = () => openAccountDetailModal(acc);
        card.innerHTML = `
          <div style="display:flex; align-items:center; gap:16px;">
            <div class="card-icon-wrapper" style="background:${acc.cor}33; color:${acc.cor}">${escapeHtml(acc.icone)}</div>
            <div class="card-info-content"><div class="card-info-name">${escapeHtml(acc.nome)}</div><div class="card-info-subtitle">Saldo atual</div></div>
            <div class="card-side-value" style="color:${acc.cor}">${formatCurrency(acc.saldoAtual)}</div>
          </div>
          <div class="progress-track"><div class="progress-fill" style="width:0%; background:${acc.cor}" data-target-width="${pct}"></div></div>
          <div class="account-card-footer">
            <span>${movimentacoes.length} movimentações</span>
            <span>${ultima ? `Última ${formatRelativeDate(ultima.data)}` : 'Sem movimentações'}</span>
          </div>`;
        list.appendChild(card);
      });
      setTimeout(() => {
        list.querySelectorAll('.progress-fill[data-target-width]').forEach(el => { el.style.width = el.dataset.targetWidth + '%'; });
      }, 50);
    }

    function openAccountModal(acc = null) {
      const modal = document.getElementById('modal-account');
      const btnDel = document.getElementById('btn-delete-acc');
      document.getElementById('form-account').reset();
      document.getElementById('acc-id').value = '';
      document.getElementById('acc-color').value = '#0F62FE';
      btnDel.style.display = 'none';
      if (acc) {
        document.getElementById('modal-account-title').innerText = 'Editar Conta';
        document.getElementById('acc-id').value = acc.id;
        document.getElementById('acc-name').value = acc.nome;
        document.getElementById('acc-initial').value = acc.saldoAtual;
        document.getElementById('acc-icon').value = acc.icone;
        document.getElementById('acc-color').value = acc.cor;
        document.getElementById('acc-initial-label').innerText = 'Saldo Atual (R$)';
        document.getElementById('acc-initial-hint').style.display = 'block';
        btnDel.style.display = 'block';
      } else {
        document.getElementById('modal-account-title').innerText = 'Nova Conta';
        document.getElementById('acc-initial-label').innerText = 'Saldo Inicial (R$)';
        document.getElementById('acc-initial-hint').style.display = 'none';
      }
      setupColorPickers();
      modal.classList.add('active');
      focusFirstField('modal-account');
    }
    function closeAccountModal() { document.getElementById('modal-account').classList.remove('active'); }

    async function saveAccount(e) {
      e.preventDefault();
      const id = document.getElementById('acc-id').value;
      const novoSaldo = Number(document.getElementById('acc-initial').value);
      const data = {
        nome: document.getElementById('acc-name').value,
        icone: document.getElementById('acc-icon').value,
        cor: document.getElementById('acc-color').value
      };
      if (id) {
        const contaAtual = cachedAccounts.find(a => a.id === Number(id));
        const saldoAnterior = contaAtual ? Number(contaAtual.saldoAtual) : novoSaldo;
        data.id = Number(id);
        data.saldoAtual = saldoAnterior; // o ajuste (se houver) é aplicado abaixo, via transação
        await db.updateConta(data);
        const delta = novoSaldo - saldoAnterior;
        if (delta !== 0) {
          await db.addTransacao({
            tipo: 'ajuste',
            valor: delta,
            contaId: Number(id),
            data: getReferenceDate().toISOString().split('T')[0],
            descricao: 'Ajuste de saldo'
          });
        }
      } else {
        data.saldoAtual = novoSaldo;
        await db.addConta(data);
      }
      closeAccountModal();
      await renderAll();
    }

    async function deleteAccount() {
      const id = Number(document.getElementById('acc-id').value);
      const emUso = cachedTransactions.some(t => t.contaId === id || t.contaDestinoId === id);
      if (emUso) {
        showToast('Esta conta possui movimentações vinculadas e não pode ser excluída. Remova ou reatribua as transações primeiro.', 'error');
        return;
      }
      const ok = await showConfirm({ title: 'Remover esta conta?', message: 'Essa ação não pode ser desfeita.', confirmText: 'Remover' });
      if (ok) {
        await db.deleteConta(id);
        closeAccountModal();
        await renderAll();
      }
    }

    function buildInvestmentCard(inv) {
      const rend = Number(inv.patrimônioAtual) - Number(inv.valorAportado);
      const card = document.createElement('div'); card.className = 'card investment-card'; card.onclick = () => openInvestmentDetailModal(inv);
      card.innerHTML = `
        <div class="card-icon-wrapper" style="background:var(--accent-secondary); color:var(--accent-primary)">${icon('trendingUp', 20)}</div>
        <div class="card-info-content">
          <div class="card-info-name">${escapeHtml(inv.nome)}</div>
          <div class="card-info-subtitle">${escapeHtml(inv.instituicao)} • ${escapeHtml(inv.tipo)}</div>
          <div class="budget-indicator ${rend>=0?'value-positive':'value-negative'}" style="background:none; padding:0; font-size:11px;">Rendimento: ${formatCurrency(rend)}</div>
        </div>
        <div class="card-side-value">${formatCurrency(Number(inv.patrimônioAtual))}</div>
      `;
      return card;
    }

    function renderInvestments() {
      const list = document.getElementById('investments-list');
      const subList = document.getElementById('accounts-investments-list');
      list.innerHTML = ''; subList.innerHTML = '';

      if (cachedInvestments.length === 0) {
        const empty = `<div style="text-align:center; padding:20px; color:var(--text-secondary); font-size:12px;">Sem ativos.</div>`;
        list.innerHTML = empty; subList.innerHTML = empty; return;
      }

      cachedInvestments.forEach(inv => {
        list.appendChild(buildInvestmentCard(inv));
        subList.appendChild(buildInvestmentCard(inv));
      });
    }

    function openInvestmentDetailModal(inv) {
      const movimentacoes = cachedTransactions.filter(t => t.investimentoId === inv.id);
      const ultima = movimentacoes[0]; // cachedTransactions já vem ordenado do mais recente pro mais antigo
      const rend = Number(inv.patrimônioAtual) - Number(inv.valorAportado);

      document.getElementById('investment-detail-icon').innerHTML = icon('trendingUp', 22);
      document.getElementById('investment-detail-title').innerText = inv.nome;
      document.getElementById('investment-detail-patrimonio').innerText = formatCurrency(inv.patrimônioAtual);
      document.getElementById('investment-detail-aportado').innerText = formatCurrency(inv.valorAportado);
      const rendEl = document.getElementById('investment-detail-rendimento');
      rendEl.innerText = formatCurrency(rend);
      rendEl.className = 'stat-chip-value ' + (rend >= 0 ? 'value-positive' : 'value-negative');
      document.getElementById('investment-detail-ultima').innerText = ultima ? formatRelativeDate(ultima.data) : '—';

      const editBtn = document.getElementById('investment-detail-edit-btn');
      editBtn.onclick = () => {
        document.getElementById('modal-investment-detail').classList.remove('active');
        openInvestmentModal(inv);
      };

      const listContainer = document.getElementById('investment-detail-tx-list');
      listContainer.innerHTML = '';
      if (movimentacoes.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center; padding:16px; color:var(--text-secondary); font-size:13px;">Nenhuma movimentação neste ativo ainda.</div>`;
      } else {
        movimentacoes.forEach(tx => {
          listContainer.appendChild(wrapTransactionCardWithSwipe(createTransactionCard(tx, true), tx));
        });
      }

      document.getElementById('modal-investment-detail').classList.add('active');
      focusFirstField('modal-investment-detail');
    }

    function openInvestmentModal(inv=null){
      const modal = document.getElementById('modal-investment');
      const btnDel = document.getElementById('btn-delete-inv');
      document.getElementById('form-investment').reset(); document.getElementById('inv-id').value = ''; btnDel.style.display = 'none';
      if(inv) {
        document.getElementById('modal-investment-title').innerText = 'Editar Ativo';
        document.getElementById('inv-id').value = inv.id;
        document.getElementById('inv-name').value = inv.nome;
        document.getElementById('inv-institution').value = inv.instituicao;
        document.getElementById('inv-type').value = inv.tipo;
        document.getElementById('inv-invested').value = inv.valorAportado;
        document.getElementById('inv-current').value = inv.patrimônioAtual;
        btnDel.style.display = 'block';
      } else { document.getElementById('modal-investment-title').innerText = 'Nova Aplicação'; }
      modal.classList.add('active');
      focusFirstField('modal-investment');
    }
    function closeInvestmentModal() { document.getElementById('modal-investment').classList.remove('active'); }
    async function saveInvestment(e){
      e.preventDefault(); const id = document.getElementById('inv-id').value;
      const data = {
        nome: document.getElementById('inv-name').value, instituicao: document.getElementById('inv-institution').value, tipo: document.getElementById('inv-type').value,
        valorAportado: Number(document.getElementById('inv-invested').value), patrimônioAtual: Number(document.getElementById('inv-current').value),
        rendimentoAcumulado: Number(document.getElementById('inv-current').value) - Number(document.getElementById('inv-invested').value)
      };
      if(id){ data.id = Number(id); await db.updateInvestimento(data); } else { await db.addInvestimento(data); }
      closeInvestmentModal(); await renderAll();
    }
    async function deleteInvestment(){
      const ok = await showConfirm({ title: 'Remover este ativo?', message: 'Essa ação não pode ser desfeita.', confirmText: 'Remover' });
      if (ok) { await db.deleteInvestimento(document.getElementById('inv-id').value); closeInvestmentModal(); await renderAll(); }
    }

    function renderCategories() {
      const list = document.getElementById('categories-list'); list.innerHTML = '';
      if (cachedCategories.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-secondary);">Nenhuma categoria cadastrada ainda. Toque em "+ Nova" para criar a primeira.</div>`;
        return;
      }
      const agora = getReferenceDate();
      const anoMesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
      cachedCategories.forEach(cat => {
        const card = document.createElement('div'); card.className = 'card category-card'; card.onclick = () => openCategoryModal(cat);
        let budgetHtml = '';
        if (cat.orcamento) {
          const gastoMes = cachedTransactions
            .filter(t => t.tipo === 'despesa' && t.categoriaId === cat.id && t.data && t.data.startsWith(anoMesAtual))
            .reduce((sum, t) => sum + Number(t.valor), 0);
          const pct = Math.round((gastoMes / Number(cat.orcamento)) * 100);
          const estourou = gastoMes > Number(cat.orcamento);
          budgetHtml = `<div class="budget-indicator" style="${estourou ? `background:${getComputedStyle(document.documentElement).getPropertyValue('--danger')}20; color:var(--danger)` : ''}">${formatCurrency(gastoMes)} de ${formatCurrency(Number(cat.orcamento))} (${pct}%) neste mês</div>`;
        }
        card.innerHTML = `<div class="card-icon-wrapper" style="background:${cat.cor}33; color:${cat.cor}">${escapeHtml(cat.icone)}</div><div class="card-info-content"><div class="card-info-name">${escapeHtml(cat.nome)}</div>${budgetHtml}</div>`;
        list.appendChild(card);
      });
    }
    function openCategoryModal(cat = null) {
      const modal = document.getElementById('modal-category');
      const btnDel = document.getElementById('btn-delete-cat');
      document.getElementById('form-category').reset();
      document.getElementById('cat-id').value = '';
      document.getElementById('cat-color').value = '#0F62FE';
      btnDel.style.display = 'none';
      if (cat) {
        document.getElementById('modal-category-title').innerText = 'Editar Categoria';
        document.getElementById('cat-id').value = cat.id;
        document.getElementById('cat-name').value = cat.nome;
        document.getElementById('cat-icon').value = cat.icone;
        document.getElementById('cat-budget').value = cat.orcamento || '';
        document.getElementById('cat-color').value = cat.cor;
        btnDel.style.display = 'block';
      } else {
        document.getElementById('modal-category-title').innerText = 'Nova Categoria';
      }
      setupColorPickers();
      modal.classList.add('active');
      focusFirstField('modal-category');
    }
    function closeCategoryModal() { document.getElementById('modal-category').classList.remove('active'); }
    async function saveCategory(e){ e.preventDefault(); const id = document.getElementById('cat-id').value; const data = { nome: document.getElementById('cat-name').value, icone: document.getElementById('cat-icon').value, orcamento: Number(document.getElementById('cat-budget').value)||null, cor: document.getElementById('cat-color').value }; if(id){ data.id = Number(id); await db.updateCategoria(data); } else { await db.addCategoria(data); } closeCategoryModal(); await renderAll(); }

    async function deleteCategory() {
      const id = Number(document.getElementById('cat-id').value);
      const emUso = cachedTransactions.some(t => t.categoriaId === id);
      if (emUso) {
        showToast('Esta categoria está associada a transações existentes e não pode ser excluída. Reatribua essas transações a outra categoria primeiro.', 'error');
        return;
      }
      const ok = await showConfirm({ title: 'Remover esta categoria?', message: 'Essa ação não pode ser desfeita.', confirmText: 'Remover' });
      if (ok) {
        await db.deleteCategoria(id);
        closeCategoryModal();
        await renderAll();
      }
    }

    function populateFilterSelectors() {
      const monthsSet = new Set(); cachedTransactions.forEach(t => t.data && monthsSet.add(t.data.substring(0,7)));
      document.getElementById('filter-month').innerHTML = '<option value="">Todos os Meses</option>' + Array.from(monthsSet).sort().reverse().map(m => `<option value="${m}">${m}</option>`).join('');
    }
    function formatGroupDateLabel(dateStr) {
      const hoje = getReferenceDate();
      const [y, m, d] = dateStr.split('-').map(Number);
      const data = new Date(y, m - 1, d);
      const diffDias = Math.round((new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()) - new Date(data.getFullYear(), data.getMonth(), data.getDate())) / 86400000);
      if (diffDias === 0) return 'Hoje';
      if (diffDias === 1) return 'Ontem';
      return data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
    }
    function applyFilters() { renderTransactions(); }
    function renderTransactions() {
      updateSwipeHintVisibility();
      const list = document.getElementById('transactions-list'); list.innerHTML = '';
      const fM = document.getElementById('filter-month').value; const fT = document.getElementById('filter-type').value;
      const filtered = cachedTransactions.filter(t => (!fM || t.data.startsWith(fM)) && (!fT || t.tipo === fT));
      if (filtered.length === 0) { list.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-secondary);">Sem movimentações correspondentes.</div>`; return; }
      let lastGroup = null;
      filtered.forEach(t => {
        const label = formatGroupDateLabel(t.data);
        if (label !== lastGroup) {
          const header = document.createElement('div');
          header.className = 'tx-date-header';
          header.textContent = label;
          list.appendChild(header);
          lastGroup = label;
        }
        list.appendChild(wrapTransactionCardWithSwipe(createTransactionCard(t, false), t));
      });
    }

    async function switchTab(viewId, btn) {
      document.querySelectorAll('.section-view').forEach(v => v.classList.remove('active'));
      document.getElementById('view-' + viewId).classList.add('active');
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      btn.classList.add('active');
      await renderAll();
      if (viewId === 'mais') await renderSettingsSecurity();
    }

    // Navega para uma sub-tela acessada a partir do menu "Mais" (Relatórios, Investimentos, Locais,
    // Rankings, Categorias, Calendário, Insights). Mantém "Mais" marcado como aba ativa.
    async function goToSubView(viewId) {
      document.querySelectorAll('.section-view').forEach(v => v.classList.remove('active'));
      document.getElementById('view-' + viewId).classList.add('active');
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      const maisBtn = document.querySelector('.nav-item[data-nav="mais"]');
      if (maisBtn) maisBtn.classList.add('active');
      await renderAll();
      if (viewId === 'relatorios') { renderReport(); setTimeout(updateReportTabsScrollHint, 0); }
      else if (viewId === 'calendario') renderCalendar();
      else if (viewId === 'insights') await renderInsights();
      else if (viewId === 'mais') await renderSettingsSecurity();
      else if (viewId === 'categorias') renderCategories();
    }

    function toggleTheme() {
      const h = document.documentElement; h.setAttribute('data-theme', h.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
      // Redesenha gráficos/calendário ativos para acompanhar as novas cores do tema
      if (document.getElementById('view-relatorios').classList.contains('active')) renderReport();
      if (document.getElementById('view-calendario').classList.contains('active')) renderCalendar();
    }

    function getReferenceDate() { return new Date(2026, 6, 13); } // Data de referência ("hoje") do sistema

    // ==========================================
    // BUSCA GLOBAL
    // ==========================================
    function openSearch() {
      document.getElementById('modal-search').classList.add('active');
      const input = document.getElementById('search-input');
      input.value = '';
      document.getElementById('search-results').innerHTML = '<div class="search-empty">Digite para buscar em suas movimentações.</div>';
      setTimeout(() => input.focus(), 150);
    }
    function closeSearch() { document.getElementById('modal-search').classList.remove('active'); }

    function runSearch() {
      const q = document.getElementById('search-input').value.trim().toLowerCase();
      const container = document.getElementById('search-results');

      if (!q) { container.innerHTML = '<div class="search-empty">Digite para buscar em suas movimentações.</div>'; return; }

      const results = cachedTransactions.filter(tx => {
        const cat = cachedCategories.find(c => c.id === tx.categoriaId);
        const acc = cachedAccounts.find(a => a.id === tx.contaId);
        const accDest = cachedAccounts.find(a => a.id === tx.contaDestinoId);
        const haystack = [tx.descricao, tx.estabelecimento, cat ? cat.nome : '', acc ? acc.nome : '', accDest ? accDest.nome : ''].join(' ').toLowerCase();
        return haystack.includes(q);
      });

      container.innerHTML = '';
      if (results.length === 0) { container.innerHTML = `<div class="search-empty">Nenhum resultado para "${q}".</div>`; return; }

      const title = document.createElement('div');
      title.className = 'search-group-title';
      title.innerText = `${results.length} resultado(s) encontrado(s)`;
      container.appendChild(title);

      results.forEach(tx => {
        const card = createTransactionCard(tx);
        const originalClick = card.onclick;
        card.onclick = () => { closeSearch(); originalClick(); };
        container.appendChild(card);
      });
    }

    // ==========================================
    // RELATÓRIOS (GRÁFICOS EM CANVAS PURO)
    // ==========================================
    let currentReport = 'categoria';
    let reportPeriod = '';

    function switchReport(type, btn) {
      currentReport = type;
      document.querySelectorAll('.report-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderReport();
    }

    function renderReport() {
      const container = document.getElementById('report-content');
      container.innerHTML = '';
      if (currentReport === 'categoria') renderReportCategoria(container);
      else if (currentReport === 'receitasdespesas') renderReportReceitasDespesas(container);
      else if (currentReport === 'patrimonio') renderReportPatrimonio(container);
      else if (currentReport === 'saldo') renderReportSaldo(container);
      else if (currentReport === 'estabelecimento') renderReportEstabelecimento(container);
    }

    function createPeriodFilterRow() {
      const row = document.createElement('div');
      row.className = 'filters-container';
      const monthsSet = new Set(); cachedTransactions.forEach(t => t.data && monthsSet.add(t.data.substring(0, 7)));
      const months = Array.from(monthsSet).sort().reverse();
      row.innerHTML = `<select class="filter-select" style="width:100%">
        <option value="">Todo o período</option>
        ${months.map(m => `<option value="${m}" ${m === reportPeriod ? 'selected' : ''}>${m}</option>`).join('')}
      </select>`;
      row.querySelector('select').onchange = (e) => { reportPeriod = e.target.value; renderReport(); };
      return row;
    }

    function createChartCard(title) {
      const card = document.createElement('div');
      card.className = 'chart-card';
      card.innerHTML = `<div class="chart-title">${title}</div><canvas class="chart-canvas"></canvas><div class="chart-legend"></div>`;
      return card;
    }

    function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

    function prepCanvas(canvas, cssHeight) {
      const dpr = window.devicePixelRatio || 1;
      const cssWidth = canvas.parentElement.clientWidth - 36; // desconta padding do chart-card (18px cada lado)
      canvas.width = cssWidth * dpr;
      canvas.height = cssHeight * dpr;
      canvas.style.width = cssWidth + 'px';
      canvas.style.height = cssHeight + 'px';
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      canvas._cssWidth = cssWidth;
      return ctx;
    }

    function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function showEmptyChart(card, canvas, msg) {
      card.querySelector('.chart-title').insertAdjacentHTML('afterend', `<div style="text-align:center;padding:30px;color:var(--text-secondary);font-size:13px;">${msg}</div>`);
      canvas.remove();
    }

    function drawLineChart(canvas, series, color) {
      const cssHeight = 220;
      const ctx = prepCanvas(canvas, cssHeight);
      const cssW = canvas._cssWidth;
      const padding = 18, chartH = 150, topPad = 20, baseY = topPad + chartH;
      const vals = series.map(s => s.valor);
      const maxV = Math.max(...vals), minV = Math.min(...vals);
      const range = (maxV - minV) || Math.abs(maxV) || 1;
      const stepX = series.length > 1 ? (cssW - padding * 2) / (series.length - 1) : 0;

      ctx.strokeStyle = cssVar('--border-color'); ctx.lineWidth = 1;
      for (let i = 0; i <= 3; i++) {
        const y = topPad + (chartH / 3) * i;
        ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(cssW - padding, y); ctx.stroke();
      }

      const points = series.map((s, i) => ({
        x: padding + stepX * i,
        y: topPad + chartH - ((s.valor - minV) / range) * chartH
      }));

      ctx.beginPath();
      ctx.moveTo(points[0].x, baseY);
      points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[points.length - 1].x, baseY);
      ctx.closePath();
      ctx.fillStyle = color + '22';
      ctx.fill();

      ctx.beginPath();
      points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();

      points.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); });

      ctx.fillStyle = cssVar('--text-secondary'); ctx.font = '700 10px sans-serif'; ctx.textAlign = 'center';
      series.forEach((s, i) => {
        if (series.length > 8 && i % 2 !== 0 && i !== series.length - 1) return;
        const [y, m] = s.mes.split('-');
        const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
        ctx.fillText(label, points[i].x, baseY + 16);
      });
    }

    function renderReportCategoria(container) {
      container.appendChild(createPeriodFilterRow());
      const card = createChartCard('Gastos por Categoria');
      container.appendChild(card);
      const canvas = card.querySelector('canvas');
      const legend = card.querySelector('.chart-legend');

      const despesas = cachedTransactions.filter(t => t.tipo === 'despesa' && (!reportPeriod || (t.data && t.data.startsWith(reportPeriod))));
      const map = {};
      despesas.forEach(t => {
        const cat = cachedCategories.find(c => c.id === t.categoriaId);
        const key = cat ? cat.nome : 'Sem categoria';
        const color = cat ? cat.cor : '#8B949E';
        if (!map[key]) map[key] = { valor: 0, color };
        map[key].valor += Number(t.valor);
      });
      const entries = Object.keys(map).map(k => ({ name: k, ...map[k] })).sort((a, b) => b.valor - a.valor);
      const total = entries.reduce((s, e) => s + e.valor, 0);

      if (entries.length === 0) { showEmptyChart(card, canvas, 'Sem despesas no período selecionado.'); return; }

      const ctx = prepCanvas(canvas, 240);
      const cssW = canvas._cssWidth;
      const cx = cssW / 2, cy = 115, rOuter = 95, rInner = 58;
      let startAngle = -Math.PI / 2;
      entries.forEach(e => {
        const slice = (e.valor / total) * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, rOuter, startAngle, startAngle + slice);
        ctx.closePath(); ctx.fillStyle = e.color; ctx.fill();
        startAngle += slice;
      });

      ctx.beginPath(); ctx.arc(cx, cy, rInner, 0, Math.PI * 2); ctx.fillStyle = cssVar('--bg-secondary'); ctx.fill();

      ctx.fillStyle = cssVar('--text-secondary'); ctx.font = '700 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('TOTAL GASTO', cx, cy - 8);
      ctx.fillStyle = cssVar('--text-primary'); ctx.font = '800 14px sans-serif';
      ctx.fillText(formatCurrency(total), cx, cy + 12);

      entries.forEach(e => {
        const pct = ((e.valor / total) * 100).toFixed(1);
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML = `<span class="legend-dot" style="background:${e.color}"></span>${escapeHtml(e.name)} — ${formatCurrency(e.valor)} (${pct}%)`;
        legend.appendChild(item);
      });
    }

    function renderReportReceitasDespesas(container) {
      const card = createChartCard('Receitas x Despesas (por mês)');
      container.appendChild(card);
      const canvas = card.querySelector('canvas');
      const legend = card.querySelector('.chart-legend');

      const monthsSet = new Set(); cachedTransactions.forEach(t => t.data && monthsSet.add(t.data.substring(0, 7)));
      let months = Array.from(monthsSet).sort().slice(-6);

      if (months.length === 0) { showEmptyChart(card, canvas, 'Sem dados suficientes para gerar o gráfico.'); return; }

      const data = months.map(m => {
        let receita = 0, despesa = 0;
        cachedTransactions.forEach(t => {
          if (!t.data || !t.data.startsWith(m)) return;
          if (t.tipo === 'receita') receita += Number(t.valor);
          if (t.tipo === 'despesa') despesa += Number(t.valor);
        });
        return { mes: m, receita, despesa };
      });

      const maxVal = Math.max(...data.map(d => Math.max(d.receita, d.despesa)), 1);
      const ctx = prepCanvas(canvas, 240);
      const cssW = canvas._cssWidth;
      const padding = 10, chartH = 180, topPad = 10, baseY = topPad + chartH;
      const groupW = (cssW - padding * 2) / data.length;
      const barW = Math.min(20, groupW / 4);

      ctx.strokeStyle = cssVar('--border-color');
      ctx.beginPath(); ctx.moveTo(padding, baseY); ctx.lineTo(cssW - padding, baseY); ctx.stroke();

      data.forEach((d, i) => {
        const cx = padding + groupW * i + groupW / 2;
        const hR = (d.receita / maxVal) * chartH;
        const hD = (d.despesa / maxVal) * chartH;
        ctx.fillStyle = '#39D353';
        roundRect(ctx, cx - barW - 3, baseY - hR, barW, Math.max(hR, 1), 4); ctx.fill();
        ctx.fillStyle = '#FF7B72';
        roundRect(ctx, cx + 3, baseY - hD, barW, Math.max(hD, 1), 4); ctx.fill();

        ctx.fillStyle = cssVar('--text-secondary'); ctx.font = '700 10px sans-serif'; ctx.textAlign = 'center';
        const [y, mo] = d.mes.split('-');
        const label = new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
        ctx.fillText(label, cx, baseY + 16);
      });

      legend.innerHTML = `<div class="legend-item"><span class="legend-dot" style="background:#39D353"></span>Receitas</div><div class="legend-item"><span class="legend-dot" style="background:#FF7B72"></span>Despesas</div>`;
    }

    function computePatrimonioSeries() {
      const currentTotal = cachedAccounts.reduce((s, a) => s + Number(a.saldoAtual), 0) + cachedInvestments.reduce((s, i) => s + Number(i.patrimônioAtual), 0);
      const sorted = [...cachedTransactions].filter(t => t.data).sort((a, b) => new Date(a.data) - new Date(b.data));
      let sumEffects = 0;
      sorted.forEach(t => {
        const v = Number(t.valor);
        if (t.tipo === 'receita' || t.tipo === 'rendimento') sumEffects += v;
        else if (t.tipo === 'despesa') sumEffects -= v;
      });
      let running = currentTotal - sumEffects;
      const monthlyMap = {};
      sorted.forEach(t => {
        const v = Number(t.valor);
        if (t.tipo === 'receita' || t.tipo === 'rendimento') running += v;
        else if (t.tipo === 'despesa') running -= v;
        monthlyMap[t.data.substring(0, 7)] = running;
      });
      return Object.keys(monthlyMap).sort().map(m => ({ mes: m, valor: monthlyMap[m] }));
    }

    function computeSaldoSeries() {
      const currentSaldo = cachedAccounts.reduce((s, a) => s + Number(a.saldoAtual), 0);
      const sorted = [...cachedTransactions].filter(t => t.data).sort((a, b) => new Date(a.data) - new Date(b.data));
      let sumEffects = 0;
      sorted.forEach(t => {
        const v = Number(t.valor);
        if (t.tipo === 'receita') sumEffects += v;
        else if (t.tipo === 'despesa' || t.tipo === 'aporte') sumEffects -= v;
      });
      let running = currentSaldo - sumEffects;
      const monthlyMap = {};
      sorted.forEach(t => {
        const v = Number(t.valor);
        if (t.tipo === 'receita') running += v;
        else if (t.tipo === 'despesa' || t.tipo === 'aporte') running -= v;
        monthlyMap[t.data.substring(0, 7)] = running;
      });
      return Object.keys(monthlyMap).sort().map(m => ({ mes: m, valor: monthlyMap[m] }));
    }

    function renderReportPatrimonio(container) {
      const card = createChartCard('Evolução do Patrimônio');
      container.appendChild(card);
      const canvas = card.querySelector('canvas');
      const series = computePatrimonioSeries();
      if (series.length < 2) { showEmptyChart(card, canvas, 'Histórico insuficiente. Registre movimentações em datas diferentes para gerar a evolução.'); return; }
      drawLineChart(canvas, series, '#58A6FF');
      const legend = card.querySelector('.chart-legend');
      const diff = series[series.length - 1].valor - series[0].valor;
      const pct = series[0].valor !== 0 ? (diff / Math.abs(series[0].valor) * 100) : 0;
      legend.innerHTML = `<div class="legend-item">${icon(diff >= 0 ? 'trendingUp' : 'trendingDown', 14)} Variação no período: <b style="margin-left:4px;color:${diff >= 0 ? 'var(--success)' : 'var(--danger)'}">${diff >= 0 ? '+' : ''}${formatCurrency(diff)} (${pct.toFixed(1)}%)</b></div>`;
    }

    function renderReportSaldo(container) {
      const card = createChartCard('Evolução do Saldo Disponível');
      container.appendChild(card);
      const canvas = card.querySelector('canvas');
      const series = computeSaldoSeries();
      if (series.length < 2) { showEmptyChart(card, canvas, 'Histórico insuficiente. Registre movimentações em datas diferentes para gerar a evolução.'); return; }
      drawLineChart(canvas, series, '#0F62FE');
      const legend = card.querySelector('.chart-legend');
      const diff = series[series.length - 1].valor - series[0].valor;
      legend.innerHTML = `<div class="legend-item">${icon(diff >= 0 ? 'trendingUp' : 'trendingDown', 14)} Variação no período: <b style="margin-left:4px;color:${diff >= 0 ? 'var(--success)' : 'var(--danger)'}">${diff >= 0 ? '+' : ''}${formatCurrency(diff)}</b></div>`;
    }

    function renderReportEstabelecimento(container) {
      container.appendChild(createPeriodFilterRow());
      const card = createChartCard('Gastos por Estabelecimento');
      container.appendChild(card);
      const canvas = card.querySelector('canvas');

      const despesas = cachedTransactions.filter(t => t.tipo === 'despesa' && t.estabelecimento && (!reportPeriod || (t.data && t.data.startsWith(reportPeriod))));
      const map = {};
      despesas.forEach(t => { const key = t.estabelecimento.trim(); map[key] = (map[key] || 0) + Number(t.valor); });
      const entries = Object.keys(map).map(k => ({ name: k, valor: map[k] })).sort((a, b) => b.valor - a.valor).slice(0, 8);

      if (entries.length === 0) { showEmptyChart(card, canvas, 'Sem gastos por estabelecimento no período selecionado.'); return; }

      const rowH = 36;
      const ctx = prepCanvas(canvas, entries.length * rowH + 10);
      const cssW = canvas._cssWidth;
      const maxV = Math.max(...entries.map(e => e.valor));
      const labelW = 96;

      entries.forEach((e, i) => {
        const y = i * rowH + rowH / 2;
        const barMaxW = cssW - labelW - 78;
        const barW = Math.max((e.valor / maxV) * barMaxW, 4);
        const color = COLORS[i % COLORS.length];

        ctx.fillStyle = cssVar('--text-primary'); ctx.font = '600 11px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        const name = e.name.length > 13 ? e.name.substring(0, 12) + '…' : e.name;
        ctx.fillText(name, 0, y);

        ctx.fillStyle = color;
        roundRect(ctx, labelW, y - 8, barW, 16, 8); ctx.fill();

        ctx.fillStyle = cssVar('--text-primary'); ctx.font = '700 11px sans-serif';
        ctx.fillText(formatCurrency(e.valor), labelW + barW + 8, y);
      });
    }

    // ==========================================
    // CALENDÁRIO
    // ==========================================
    let calDate = getReferenceDate();

    function changeCalMonth(delta) { calDate = new Date(calDate.getFullYear(), calDate.getMonth() + delta, 1); renderCalendar(); }

    function renderCalendar() {
      const year = calDate.getFullYear(), month = calDate.getMonth();
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
      document.getElementById('cal-nav-title').innerText = calDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

      const dayMap = {};
      let totalRecebido = 0, totalGasto = 0;
      cachedTransactions.forEach(t => {
        if (!t.data || !t.data.startsWith(monthStr)) return;
        if (!dayMap[t.data]) dayMap[t.data] = { recebido: 0, gasto: 0, txs: [] };
        dayMap[t.data].txs.push(t);
        if (t.tipo === 'receita' || t.tipo === 'rendimento') { dayMap[t.data].recebido += Number(t.valor); totalRecebido += Number(t.valor); }
        if (t.tipo === 'despesa') { dayMap[t.data].gasto += Number(t.valor); totalGasto += Number(t.valor); }
      });

      document.getElementById('cal-total-recebido').innerText = formatCurrency(totalRecebido);
      document.getElementById('cal-total-gasto').innerText = formatCurrency(totalGasto);

      const startWeekday = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const grid = document.getElementById('cal-grid');
      grid.innerHTML = '';

      for (let i = 0; i < startWeekday; i++) { const empty = document.createElement('div'); empty.className = 'cal-day empty'; grid.appendChild(empty); }

      const ref = getReferenceDate();
      const todayStr = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}-${String(ref.getDate()).padStart(2, '0')}`;

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const cell = document.createElement('div');
        cell.className = 'cal-day' + (dateStr === todayStr ? ' today' : '');
        const info = dayMap[dateStr];
        cell.innerHTML = `<div class="cal-day-num">${d}</div>
          <div class="cal-day-vals">
            ${info && info.recebido > 0 ? `<div class="cal-day-val value-positive">+${formatCurrencyCompact(info.recebido)}</div>` : ''}
            ${info && info.gasto > 0 ? `<div class="cal-day-val value-negative">-${formatCurrencyCompact(info.gasto)}</div>` : ''}
          </div>`;
        if (info) cell.onclick = () => openDayDetail(dateStr, info);
        grid.appendChild(cell);
      }
    }

    function openDayDetail(dateStr, info) {
      const dateObj = new Date(dateStr + 'T00:00:00');
      document.getElementById('day-detail-title').innerText = dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
      document.getElementById('day-detail-stats').innerText = `Recebido: ${formatCurrency(info.recebido)}  •  Gasto: ${formatCurrency(info.gasto)}`;
      const list = document.getElementById('day-detail-tx-list');
      list.innerHTML = '';
      info.txs.forEach(tx => list.appendChild(createTransactionCard(tx)));
      document.getElementById('modal-day-detail').classList.add('active');
    }

    // ==========================================
    // INSIGHTS AUTOMÁTICOS
    // ==========================================
    async function renderInsights() {
      const container = document.getElementById('insights-list');
      container.innerHTML = '';

      const ref = getReferenceDate();
      const curMonth = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}`;
      const prevDate = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
      const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

      const insights = [];

      // Categoria que mais cresceu
      const catCur = {}, catPrev = {};
      cachedTransactions.forEach(t => {
        if (t.tipo !== 'despesa') return;
        const cat = cachedCategories.find(c => c.id === t.categoriaId);
        const key = cat ? cat.nome : 'Sem categoria';
        if (t.data && t.data.startsWith(curMonth)) catCur[key] = (catCur[key] || 0) + Number(t.valor);
        if (t.data && t.data.startsWith(prevMonth)) catPrev[key] = (catPrev[key] || 0) + Number(t.valor);
      });
      let maiorCrescimento = null;
      Object.keys(catCur).forEach(key => {
        const diff = catCur[key] - (catPrev[key] || 0);
        if (!maiorCrescimento || diff > maiorCrescimento.diff) maiorCrescimento = { key, diff, cur: catCur[key], prev: catPrev[key] || 0 };
      });
      if (maiorCrescimento && maiorCrescimento.diff > 0) {
        insights.push({ iconName: 'trendingUp', title: 'Categoria que mais cresceu', desc: `${maiorCrescimento.key} teve o maior aumento de gastos: de ${formatCurrency(maiorCrescimento.prev)} para ${formatCurrency(maiorCrescimento.cur)} neste mês.` });
      } else {
        insights.push({ iconName: 'trendingUp', title: 'Categoria que mais cresceu', desc: 'Nenhuma categoria teve aumento de gastos em relação ao mês anterior.' });
      }

      // Estabelecimento onde mais foi gasto
      const vendorMap = {};
      cachedTransactions.forEach(t => { if (t.tipo === 'despesa' && t.estabelecimento && t.data && t.data.startsWith(curMonth)) vendorMap[t.estabelecimento] = (vendorMap[t.estabelecimento] || 0) + Number(t.valor); });
      const topVendor = Object.keys(vendorMap).sort((a, b) => vendorMap[b] - vendorMap[a])[0];
      if (topVendor) {
        insights.push({ iconName: 'mapPin', title: 'Estabelecimento com mais gastos', desc: `${topVendor} foi o local com maior gasto este mês, somando ${formatCurrency(vendorMap[topVendor])}.` });
      } else {
        insights.push({ iconName: 'mapPin', title: 'Estabelecimento com mais gastos', desc: 'Nenhuma despesa com estabelecimento registrada este mês.' });
      }

      // Evolução do patrimônio
      const patSeries = computePatrimonioSeries();
      if (patSeries.length >= 2) {
        const last = patSeries[patSeries.length - 1], prev = patSeries[patSeries.length - 2];
        const diff = last.valor - prev.valor;
        const pct = prev.valor !== 0 ? (diff / Math.abs(prev.valor) * 100) : 0;
        insights.push({ iconName: diff >= 0 ? 'wallet' : 'trendingDown', title: 'Evolução do patrimônio', desc: `Seu patrimônio ${diff >= 0 ? 'cresceu' : 'caiu'} ${formatCurrency(Math.abs(diff))} (${pct.toFixed(1)}%) no último mês com movimentação, totalizando ${formatCurrency(last.valor)}.` });
      } else {
        const total = cachedAccounts.reduce((s, a) => s + Number(a.saldoAtual), 0) + cachedInvestments.reduce((s, i) => s + Number(i.patrimônioAtual), 0);
        insights.push({ iconName: 'wallet', title: 'Evolução do patrimônio', desc: `Ainda não há histórico suficiente para calcular a evolução. Patrimônio atual: ${formatCurrency(total)}.` });
      }

      // Aumento ou redução de despesas
      let despCur = 0, despPrev = 0;
      cachedTransactions.forEach(t => {
        if (t.tipo !== 'despesa') return;
        if (t.data && t.data.startsWith(curMonth)) despCur += Number(t.valor);
        if (t.data && t.data.startsWith(prevMonth)) despPrev += Number(t.valor);
      });
      const despDiff = despCur - despPrev;
      const despPct = despPrev !== 0 ? (despDiff / despPrev * 100) : (despCur > 0 ? 100 : 0);
      insights.push({
        iconName: despDiff <= 0 ? 'checkCircle' : 'alertTriangle', title: 'Despesas do mês',
        desc: (despPrev === 0 && despCur === 0) ? 'Nenhuma despesa registrada nos últimos dois meses.' :
          `Suas despesas ${despDiff >= 0 ? 'aumentaram' : 'diminuíram'} ${Math.abs(despPct).toFixed(1)}% em relação ao mês anterior (${formatCurrency(despPrev)} → ${formatCurrency(despCur)}).`
      });

      // Maior compra do período
      const despesasMes = cachedTransactions.filter(t => t.tipo === 'despesa' && t.data && t.data.startsWith(curMonth));
      if (despesasMes.length > 0) {
        const maior = despesasMes.reduce((a, b) => Number(b.valor) > Number(a.valor) ? b : a);
        const cat = cachedCategories.find(c => c.id === maior.categoriaId);
        insights.push({ iconName: 'shoppingBag', title: 'Maior compra do período', desc: `${maior.descricao || maior.estabelecimento || (cat ? cat.nome : 'Despesa')} foi a maior compra do mês, no valor de ${formatCurrency(Number(maior.valor))}${maior.estabelecimento ? ' em ' + maior.estabelecimento : ''}.` });
      } else {
        insights.push({ iconName: 'shoppingBag', title: 'Maior compra do período', desc: 'Nenhuma despesa registrada neste mês ainda.' });
      }

      // Meta de economia (definida em Mais > Meta de Economia)
      const metaEconomia = await loadMetaEconomia();
      if (metaEconomia && metaEconomia > 0) {
        let receitasCur = 0;
        cachedTransactions.forEach(t => { if (t.tipo === 'receita' && t.data && t.data.startsWith(curMonth)) receitasCur += Number(t.valor); });
        const economiaMesAtual = receitasCur - despCur;
        const pctMeta = (economiaMesAtual / metaEconomia) * 100;
        if (economiaMesAtual >= metaEconomia) {
          insights.push({ iconName: 'checkCircle', title: 'Meta de economia', desc: `Você atingiu ${pctMeta.toFixed(0)}% da sua meta de economia mensal de ${formatCurrency(metaEconomia)} — parabéns!` });
        } else if (economiaMesAtual > 0) {
          insights.push({ iconName: 'trophy', title: 'Meta de economia', desc: `Você já economizou ${formatCurrency(economiaMesAtual)} este mês, ${pctMeta.toFixed(0)}% da meta de ${formatCurrency(metaEconomia)}.` });
        } else {
          insights.push({ iconName: 'alertTriangle', title: 'Meta de economia', desc: `Suas despesas superaram as receitas este mês, então ainda não há economia acumulada para a meta de ${formatCurrency(metaEconomia)}.` });
        }
      }

      insights.forEach(ins => {
        const card = document.createElement('div');
        card.className = 'insight-card';
        card.innerHTML = `<div class="insight-icon">${icon(ins.iconName, 20)}</div><div><div class="insight-title">${escapeHtml(ins.title)}</div><div class="insight-desc">${escapeHtml(ins.desc)}</div></div>`;
        container.appendChild(card);
      });
    }

    // ==========================================
    // BACKUP: EXPORTAR / IMPORTAR DADOS (JSON)
    // ==========================================
    async function exportBackup() {
      try {
        const payload = await db.exportAll();
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const stamp = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `money-tracker-backup-${stamp}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        showToast('Não foi possível gerar o backup: ' + err.message, 'error');
      }
    }

    function handleImportFile(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const payload = JSON.parse(e.target.result);
          if (payload.app !== 'MoneyTracker' || !payload.data) {
            showToast('Este arquivo não parece ser um backup válido do Money Tracker.', 'error');
            return;
          }
          const ok = await showConfirm({ title: 'Restaurar backup?', message: 'Isso vai substituir TODOS os dados atuais pelos dados deste arquivo. Essa ação não pode ser desfeita.', confirmText: 'Restaurar' });
          if (!ok) return;
          await db.importAll(payload);
          await renderAll();
          showToast('Backup importado com sucesso.', 'success');
        } catch (err) {
          showToast('Não foi possível importar o backup: ' + err.message, 'error');
        } finally {
          event.target.value = '';
        }
      };
      reader.readAsText(file);
    }

    // ==========================================
    // ZONA DE RISCO: reset completo do app
    // ==========================================
    async function resetApp() {
      const step1 = await showConfirm({ title: 'Resetar o app?', message: 'Isso vai apagar PERMANENTEMENTE todos os dados do Money Tracker deste dispositivo: contas, categorias, transações, investimentos, PIN e meta de economia. Essa ação não pode ser desfeita.', confirmText: 'Continuar' });
      if (!step1) return;
      const step2 = await showConfirm({ title: 'Tem certeza mesmo?', message: 'Considere exportar um backup antes de continuar. Essa é a última confirmação.', confirmText: 'Resetar tudo' });
      if (!step2) return;
      try {
        if (db.db) { db.db.close(); }
        await new Promise((resolve, reject) => {
          const request = indexedDB.deleteDatabase('MoneyTrackerDB');
          request.onsuccess = () => resolve();
          request.onerror = (e) => reject(e.target.error);
          request.onblocked = () => resolve();
        });
        localStorage.clear();
        showToast('App resetado com sucesso. Recarregando…', 'success');
        setTimeout(() => location.reload(), 900);
      } catch (err) {
        showToast('Não foi possível resetar o app: ' + err.message, 'error');
      }
    }

    // ==========================================
    // BLOQUEIO POR PIN (segurança local do app)
    // ==========================================
    async function sha256(text) {
      const enc = new TextEncoder().encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', enc);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function getStoredPinHash() { return db.getConfigValue('pinHash', null); }
    async function setStoredPinHash(hash) { return db.setConfigValue('pinHash', hash); }
    async function clearStoredPinHash() { return db.deleteConfigValue('pinHash'); }

    let pinBuffer = '';
    let pinMode = 'unlock'; // 'unlock' | 'setup' | 'confirm' | 'change-old' | 'disable'
    let pinTempNew = '';

    async function initLock() {
      if (await getStoredPinHash()) {
        pinMode = 'unlock';
        showLockScreen('Digite seu PIN', false);
      } else {
        document.getElementById('lock-screen').style.display = 'none';
      }
    }

    function showLockScreen(title, showCancel) {
      pinBuffer = '';
      document.getElementById('lock-title').innerText = title;
      document.getElementById('lock-cancel-btn').style.display = showCancel ? 'block' : 'none';
      document.getElementById('lock-screen').style.display = 'flex';
      updatePinDots();
    }
    function hideLockScreen() { document.getElementById('lock-screen').style.display = 'none'; }

    function cancelLockFlow() {
      pinMode = 'unlock';
      pinTempNew = '';
      hideLockScreen();
    }

    function pinPress(digit) {
      if (pinBuffer.length >= 4) return;
      pinBuffer += digit;
      updatePinDots();
      if (pinBuffer.length === 4) setTimeout(handlePinComplete, 150);
    }
    function pinBackspace() { pinBuffer = pinBuffer.slice(0, -1); updatePinDots(); }
    function updatePinDots() {
      document.querySelectorAll('.pin-dot').forEach((dot, i) => dot.classList.toggle('filled', i < pinBuffer.length));
    }
    function shakeLock() {
      const el = document.getElementById('lock-pad');
      el.classList.add('shake');
      setTimeout(() => el.classList.remove('shake'), 400);
    }

    async function handlePinComplete() {
      const hash = await sha256(pinBuffer);

      if (pinMode === 'unlock') {
        if (hash === await getStoredPinHash()) { hideLockScreen(); }
        else { shakeLock(); pinBuffer = ''; updatePinDots(); }

      } else if (pinMode === 'setup') {
        pinTempNew = pinBuffer;
        pinMode = 'confirm';
        showLockScreen('Confirme o novo PIN', true);

      } else if (pinMode === 'confirm') {
        if (pinBuffer === pinTempNew) {
          const finalHash = await sha256(pinBuffer);
          await setStoredPinHash(finalHash);
          pinMode = 'unlock';
          pinTempNew = '';
          hideLockScreen();
          await renderSettingsSecurity();
        } else {
          showToast('Os PINs digitados não coincidem. Tente novamente.', 'error');
          pinMode = 'setup'; pinTempNew = '';
          showLockScreen('Crie um PIN de 4 dígitos', true);
        }

      } else if (pinMode === 'change-old') {
        if (hash === await getStoredPinHash()) {
          pinMode = 'setup';
          showLockScreen('Crie o novo PIN', true);
        } else { shakeLock(); pinBuffer = ''; updatePinDots(); }

      } else if (pinMode === 'disable') {
        if (hash === await getStoredPinHash()) {
          await clearStoredPinHash();
          pinMode = 'unlock';
          hideLockScreen();
          await renderSettingsSecurity();
        } else { shakeLock(); pinBuffer = ''; updatePinDots(); }
      }
    }

    function startSetupPin() { pinMode = 'setup'; showLockScreen('Crie um PIN de 4 dígitos', true); }
    function startChangePin() { pinMode = 'change-old'; showLockScreen('Digite o PIN atual', true); }
    function startDisablePin() { pinMode = 'disable'; showLockScreen('Digite o PIN para desativar', true); }
    async function lockNow() {
      if (await getStoredPinHash()) { pinMode = 'unlock'; showLockScreen('Digite seu PIN', false); }
      else { showToast('Nenhum PIN configurado ainda. Vá em "Mais" > Segurança para ativar um PIN de acesso.', 'info'); }
    }

    async function saveMetaEconomia() {
      const val = document.getElementById('meta-economia-input').value;
      await db.setConfigValue('metaEconomia', val || '');
    }
    async function loadMetaEconomia() {
      const val = await db.getConfigValue('metaEconomia', '');
      return val ? Number(val) : null;
    }
    async function renderSettingsSecurity() {
      const label = document.getElementById('security-status-label');
      const actionsEl = document.getElementById('security-actions');
      const metaInput = document.getElementById('meta-economia-input');
      const metaAtual = await db.getConfigValue('metaEconomia', '');
      if (metaInput) metaInput.value = metaAtual || '';
      if (!label || !actionsEl) return;
      const hasPin = !!(await getStoredPinHash());

      label.innerText = hasPin ? 'PIN de acesso: ativado' : 'PIN de acesso: desativado';
      actionsEl.innerHTML = '';

      if (hasPin) {
        const btnChange = document.createElement('button');
        btnChange.className = 'security-btn';
        btnChange.innerText = 'Alterar PIN';
        btnChange.onclick = startChangePin;
        const btnDisable = document.createElement('button');
        btnDisable.className = 'security-btn danger';
        btnDisable.innerText = 'Desativar PIN';
        btnDisable.onclick = startDisablePin;
        actionsEl.appendChild(btnChange);
        actionsEl.appendChild(btnDisable);
      } else {
        const btnEnable = document.createElement('button');
        btnEnable.className = 'security-btn';
        btnEnable.style.color = 'var(--accent-primary)';
        btnEnable.style.borderColor = 'var(--accent-primary)';
        btnEnable.innerText = 'Ativar PIN de acesso';
        btnEnable.onclick = startSetupPin;
        actionsEl.appendChild(btnEnable);
      }
    }
