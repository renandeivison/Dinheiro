# Refatoração do Sistema de Navegação do Botão Voltar

## Problema Atual

O aplicativo usa `classList.contains('active')` para descobrir qual modal fechar ao pressionar o botão Voltar do Android. Isso causa:

1. **Ordem ambígua**: Se múltiplos modais estão abertos, qual fechar primeiro?
2. **Dependência do DOM**: Estado guardado no CSS, não em código
3. **Race conditions**: A ordem dos elementos no `BACK_BUTTON_HANDLERS` pode não corresponder à ordem de abertura
4. **Difícil de debugar**: Nenhuma forma clara de saber o "estado" da navegação

## Solução: Navigation Stack

Uma **pilha explícita** que rastreia a ordem exata em que elementos foram abertos:

```
Tela inicial (Dashboard)
  ↓ clica em Contas
Tela Contas
  ↓ abre FAB
FAB aberto
  ↓ clica em "Nova Conta"
Modal Nova Conta aberto
  ↓ modal pede confirmação
Diálogo Confirmar aberto
```

**Pilha (topo → base):**
```
- Confirmar
- Modal Conta
- FAB
- (Dashboard)
```

Ao pressionar Voltar, sempre fecha do topo.

---

## Arquitetura Atual vs Nova

### Arquitetura Atual (linhas 163-203 em app.js)

```javascript
function armBackGuard() {
  history.pushState({ mtBackGuard: true }, '');
}

window.addEventListener('popstate', () => {
  let handled = false;
  
  // Percorre BACK_BUTTON_HANDLERS procurando classList.contains('active')
  for (const id in BACK_BUTTON_HANDLERS) {
    const el = document.getElementById(id);
    if (el && el.classList.contains('active')) {
      BACK_BUTTON_HANDLERS[id]();
      handled = true;
      break; 
    }
  }

  if (handled) {
    setTimeout(armBackGuard, 10);
    return;
  }

  // Se nada encontrado, volta pro Dashboard
  const dashboardActive = document.getElementById('view-dashboard').classList.contains('active');
  if (!dashboardActive) {
    const navBtn = document.querySelector('.nav-item[data-nav="dashboard"]');
    switchTab('dashboard', navBtn);
    setTimeout(armBackGuard, 10);
    return;
  }
});
```

**Problemas:**
- `BACK_BUTTON_HANDLERS` é um objeto: ordem não garantida
- Depende de `classList.contains('active')` 
- Nenhuma rastreamento de ordem histórica
- FAB → Modal → abre modal confirmação: pode ficar confuso qual fechar

### Arquitetura Nova

**Arquivo: `navigation-stack.js`** (já criado)

```javascript
const navigationStack = new NavigationStack();

window.addEventListener('popstate', () => {
  const handled = navigationStack.pop();
  if (handled) {
    setTimeout(armNewNavigationGuard, 10);
  }
});
```

Quando algo abre:
```javascript
function openFabMenu() {
  toggleFabMenu(); // abre visualmente
  pushNavigation('fab', closeFabMenu, 'FAB Menu');
}

function openAccountModal() {
  modal.classList.add('active');
  focusFirstField('modal-account');
  pushNavigation('account-modal', closeAccountModal, 'Nova Conta');
}
```

Quando algo fecha (internamente, sem voltar):
```javascript
function closeAccountModal() {
  document.getElementById('modal-account').classList.remove('active');
  removeNavigation('account-modal'); // remove da pilha
}
```

---

## Plano de Migração (Passo a Passo)

### Fase 1: Preparação (5 min)

**Objetivo**: Incluir o novo sistema sem quebrar nada

1. Adicione `navigation-stack.js` ao `index.html` (antes de `app.js`):
   ```html
   <script src="navigation-stack.js"></script>
   <script src="app.js"></script>
   ```

2. Em `app.js`, substitua o listener de `popstate` (linhas 173-203) por:
   ```javascript
   // ==========================================
   // BOTÃO VOLTAR: Navigation Stack System
   // ==========================================
   
   function setupNavigationSystem() {
     // Setup listener do popstate
     window.addEventListener('popstate', () => {
       const handled = navigationStack.pop();
       if (handled) {
         setTimeout(armBackGuard, 10);
       }
     });
   }

   // Chama no DOMContentLoaded
   document.addEventListener('DOMContentLoaded', async () => {
     // ... código existente ...
     setupNavigationSystem(); // adicione isto
   });
   ```

3. Mantenha `armBackGuard()` como está (ainda funciona via `navigation-stack.js`)

### Fase 2: Migrar FAB (10 min)

**Encontre em app.js:**
```javascript
function toggleFabMenu() {
  const isOpen = document.getElementById('fab-menu').classList.toggle('active');
  document.getElementById('fab-backdrop').classList.toggle('active', isOpen);
  document.getElementById('fab-main').classList.toggle('open', isOpen);
  if (isOpen) armBackGuard();
}

function closeFabMenu() {
  document.getElementById('fab-menu').classList.remove('active');
  document.getElementById('fab-backdrop').classList.remove('active');
  document.getElementById('fab-main').classList.remove('open');
}
```

**Substitua por:**
```javascript
function toggleFabMenu() {
  const isOpen = document.getElementById('fab-menu').classList.toggle('active');
  document.getElementById('fab-backdrop').classList.toggle('active', isOpen);
  document.getElementById('fab-main').classList.toggle('open', isOpen);
  
  if (isOpen) {
    pushNavigation('fab-menu', closeFabMenu, 'FAB Menu');
  } else {
    removeNavigation('fab-menu');
  }
}

function closeFabMenu() {
  document.getElementById('fab-menu').classList.remove('active');
  document.getElementById('fab-backdrop').classList.remove('active');
  document.getElementById('fab-main').classList.remove('open');
  removeNavigation('fab-menu');
}
```

### Fase 3: Migrar Modal de Conta (10 min)

**Encontre:**
```javascript
function openAccountModal(acc = null) {
  const modal = document.getElementById('modal-account');
  // ... setup do modal ...
  modal.classList.add('active');
  focusFirstField('modal-account');
}

function closeAccountModal() {
  document.getElementById('modal-account').classList.remove('active');
}
```

**Substitua por:**
```javascript
function openAccountModal(acc = null) {
  const modal = document.getElementById('modal-account');
  // ... setup do modal ...
  modal.classList.add('active');
  focusFirstField('modal-account');
  pushNavigation('modal-account', closeAccountModal, 'Modal Conta');
}

function closeAccountModal() {
  document.getElementById('modal-account').classList.remove('active');
  removeNavigation('modal-account');
}
```

### Fase 4: Migrar Demais Modais (15 min cada)

Repita o padrão da Fase 3 para:

- `openTransactionModal()` / `closeTransactionModal()`
  ```javascript
  pushNavigation('modal-transaction', closeTransactionModal, 'Nova Transação');
  ```

- `openInvestmentModal()` / `closeInvestmentModal()`
  ```javascript
  pushNavigation('modal-investment', closeInvestmentModal, 'Novo Investimento');
  ```

- `openCategoryModal()` / `closeCategoryModal()`
  ```javascript
  pushNavigation('modal-category', closeCategoryModal, 'Nova Categoria');
  ```

- `openQuickTx()` / `qtxClose()`
  ```javascript
  // em openQuickTx:
  pushNavigation('modal-quick-tx', qtxClose, 'Lançamento Rápido');
  
  // em qtxClose:
  removeNavigation('modal-quick-tx');
  ```

- `openSearch()` / `closeSearch()`
- `openVendorDetailModal()` / implícito ao sair
- `openAccountDetailModal()` / implícito ao sair
- `openInvestmentDetailModal()` / implícito ao sair
- `openDayDetail()` / implícito ao sair

### Fase 5: Migrar Diálogos de Confirmação (5 min)

**Encontre em app.js:**
```javascript
function showConfirm({ title = 'Confirmar', ... } = {}) {
  // ...
  document.getElementById('modal-confirm').classList.add('active');
}

function resolveConfirm(result) {
  document.getElementById('modal-confirm').classList.remove('active');
  // ...
}
```

**Substitua por:**
```javascript
function showConfirm({ title = 'Confirmar', ... } = {}) {
  return new Promise((resolve) => {
    // ... setup existente ...
    document.getElementById('modal-confirm').classList.add('active');
    
    // Registra na pilha
    pushNavigation('modal-confirm', () => resolveConfirm(false), 'Confirmação');
  });
}

function resolveConfirm(result) {
  document.getElementById('modal-confirm').classList.remove('active');
  removeNavigation('modal-confirm');
  if (_confirmResolve) { _confirmResolve(result); _confirmResolve = null; }
}
```

### Fase 6: Limpar `BACK_BUTTON_HANDLERS` (5 min)

Quando todas as migrações forem feitas, **remova**:

```javascript
// ❌ REMOVA isto:
const BACK_BUTTON_HANDLERS = { ...MODAL_ESCAPE_HANDLERS, ... };
```

Mas mantenha `MODAL_ESCAPE_HANDLERS` para o listener de Esc (linhas 130-154):

```javascript
// ✅ MANTENHA isto (Esc ainda usa):
const MODAL_ESCAPE_HANDLERS = {
  'modal-confirm': () => resolveConfirm(false),
  'fab-menu': () => closeFabMenu(),
  // ...
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
```

---

## Guia de Padrão: Como Adicionar um Novo Modal

Se adicionar um novo modal no futuro:

```javascript
// 1. Função de abertura
async function openMyNewModal(data = null) {
  const modal = document.getElementById('modal-mynew');
  // ... setup ...
  modal.classList.add('active');
  focusFirstField('modal-mynew');
  
  // ⭐ REGISTRE na pilha
  pushNavigation('modal-mynew', closeMyNewModal, 'Meu Novo Modal');
}

// 2. Função de fechamento
function closeMyNewModal() {
  document.getElementById('modal-mynew').classList.remove('active');
  
  // ⭐ REMOVA da pilha
  removeNavigation('modal-mynew');
}

// 3. Listeners internos do modal (botões de salvar, cancelar, etc)
document.getElementById('mynew-save-btn').onclick = async () => {
  // ... salva dados ...
  closeMyNewModal(); // chama fechar, que já remove da pilha
};

document.getElementById('mynew-cancel-btn').onclick = () => {
  closeMyNewModal();
};
```

**Regra de Ouro:**
- `pushNavigation()` → quando algo **abre** e deve estar na pilha de voltar
- `removeNavigation()` → quando algo **fecha** internamente
- Botão Voltar do Android → chamado automaticamente pelo `popstate`

---

## Benefícios Após a Migração

### 1. **Sem Ambiguidade**
```
Dashboard → Contas → FAB → Modal Conta → Confirmação
           ↑        ↑       ↑              ↑
          open     open    open          open
          
Voltar → Fecha Confirmação
Voltar → Fecha Modal Conta
Voltar → Fecha FAB
Voltar → Volta pro Dashboard
Voltar → Sai do app
```

### 2. **Fácil Debug**
```javascript
// No console:
debugNavigation();
// Saída:
// 🔙 Navigation Stack (3 entries)
// 0. FAB Menu (id: fab-menu)
// 1. Modal Conta (id: modal-account)
// 2. Confirmação (id: modal-confirm)
```

### 3. **Sem `classList.contains()`**
O estado está no código, não no DOM. Mais seguro e rápido.

### 4. **Impossível Ficar Preso**
Antes: Modal 1 e Modal 2 abertos, qual fechar? Ambiguidade.
Depois: Sempre o do topo. Simples.

### 5. **Melhor Performance**
Sem varrer `BACK_BUTTON_HANDLERS` procurando `.active`. Apenas `pop()`.

---

## Checklist de Migração

- [ ] Incluir `navigation-stack.js` no `index.html`
- [ ] Substituir listener `popstate` em `app.js`
- [ ] Migrar `openFabMenu()` / `closeFabMenu()`
- [ ] Migrar `openAccountModal()` / `closeAccountModal()`
- [ ] Migrar `openTransactionModal()` / `closeTransactionModal()`
- [ ] Migrar `openInvestmentModal()` / `closeInvestmentModal()`
- [ ] Migrar `openCategoryModal()` / `closeCategoryModal()`
- [ ] Migrar `openQuickTx()` / `qtxClose()`
- [ ] Migrar `openSearch()` / `closeSearch()`
- [ ] Migrar `showConfirm()` / `resolveConfirm()`
- [ ] Remover `BACK_BUTTON_HANDLERS`
- [ ] Testar todos os fluxos de voltar
- [ ] Testar que o app fecha quando em Dashboard sem modais

---

## Teste Manual

1. **Abrir FAB + Modal + Confirmação**
   - Dashboard → FAB (Voltar: fecha FAB) → "Nova Conta" (Voltar: fecha Modal) → Confirmar (Voltar: fecha Diálogo, volta pro Modal)

2. **Abrir de Contas**
   - Dashboard → Contas (Voltar: volta pro Dashboard) → Abrir detalhe (Voltar: volta pro Contas)

3. **Confirmação Sem Modal**
   - Dashboard → Ação que pede confirmação → Sim (Voltar antes: fecha Diálogo)

4. **Fechar Manualmente**
   - Abrir Modal → Clicar "Cancelar" (Voltar: deve ir pro passo anterior, não quebrar)

5. **Sair do App**
   - Dashboard sem nada aberto → Voltar (app fecha)

---

## Notas Importantes

### ⚠️ Esc vs Voltar
- **Esc**: Ainda usa `MODAL_ESCAPE_HANDLERS` + `classList.contains('active')`
- **Voltar**: Usa nova `navigationStack`

Eles são **independentes**. Esc fecha o primeiro ativo encontrado no DOM; Voltar segue a pilha.

### ⚠️ `focusFirstField()` Chama `armBackGuard()`
```javascript
function focusFirstField(containerId) {
  armBackGuard(); // ← ainda chamado
  // ...
}
```

Isso está ok! `armBackGuard()` agora chama `armNewNavigationGuard()` que apenas faz `history.pushState()`. A pilha é gerenciada separadamente em `pushNavigation()`.

### ⚠️ Troca de Abas (Dashboard ↔ Contas ↔ Investimentos)

Essa lógica **não muda**:
```javascript
async function switchTab(viewId, btn) {
  // ...
  if (viewId !== 'dashboard') armBackGuard();
  // ...
}
```

Continue assim. A pilha é para **modais**, não para **abas de navegação principal**.

---

## Próximos Passos

Após conclusão:

1. **Documente** o padrão no README ou comentário de topo do `app.js`
2. **Adicione logs** em modo debug para melhor observabilidade
3. **Considere** adicionar animações de transição ao fechar
4. **Teste** em dispositivos Android reais (não apenas browsers)

