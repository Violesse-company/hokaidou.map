// Firebase 初期化
const firebaseConfig = {
  apiKey: "AIzaSyCkzIDMtm8HI2Q3VGG7wkV7gybVNL_4Uc4",
  authDomain: "workout-app-78f56.firebaseapp.com",
  projectId: "workout-app-78f56",
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 要素取得
const loginScreen = document.getElementById('loginScreen');
const adminScreen = document.getElementById('adminScreen');
const loginMsg = document.getElementById('loginMsg');
const tableBody = document.querySelector('#shopTable tbody');
let currentAdmin = null;
let showFilter = "all"; // "all" / "approved" / "unapproved"

// ------------------------
// 管理者ログイン
// ------------------------
document.getElementById('loginBtn').addEventListener('click', () => {
  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;

  auth.signInWithEmailAndPassword(email, password)
    .then(res => {
      currentAdmin = res.user;
      return db.collection('admins').doc(currentAdmin.uid).get();
    })
    .then(doc => {
      if (!doc.exists) throw new Error('権限なし');
      currentAdmin.role = doc.data().role || '確認';
      loginScreen.style.display = 'none';
      adminScreen.style.display = 'block';
      loadShops();
    })
    .catch(err => {
      loginMsg.textContent = err.message;
    });
});

// ログアウト
document.getElementById('logoutBtn').addEventListener('click', () => {
  auth.signOut().then(() => location.reload());
});

// ------------------------
// 申請一覧読み込み
// ------------------------
function loadShops() {
  tableBody.innerHTML = '';
  db.collection('shops').get()
    .then(snapshot => {
      snapshot.docs.forEach(doc => {
        const shop = doc.data();
        const approved = !!shop.approved;

        // フィルター制御
        if (showFilter === "approved" && !approved) return;
        if (showFilter === "unapproved" && approved) return;

        const tr = document.createElement('tr');

        // 承認/ブロックボタン（管理者以上）
        const actionBtn = ["管理者","運営"].includes(currentAdmin.role)
          ? `<button data-id="${doc.id}" data-approved="${approved}">
               ${approved ? 'ブロック' : '承認'}
             </button>`
          : '';

        // 削除ボタン（運営のみ）
        const deleteBtn = currentAdmin.role === "運営"
          ? `<button class="delete-btn" data-id="${doc.id}">削除</button>`
          : '';

        tr.innerHTML = `
          <td>${shop.name}</td>
          <td>${shop.category}</td>
          <td>${shop.hours}</td>
          <td>${shop.holiday ? shop.holiday.join('・') : ''}</td>
          <td>${shop.details}</td>
          <td>${shop.service}</td>
          <td>${shop.rating}</td>
          <td>${shop.url ? `<a href="${shop.url}" target="_blank">リンク</a>` : ''}</td>
          <td>${actionBtn} ${deleteBtn}</td>
        `;
        tableBody.appendChild(tr);
      });

      // 承認/ブロックボタン操作
      tableBody.querySelectorAll('button[data-approved]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!["管理者","運営"].includes(currentAdmin.role)) return;
          const docId = btn.dataset.id;
          const current = btn.dataset.approved === 'true';
          db.collection('shops').doc(docId).update({ approved: !current })
            .then(() => loadShops())
            .catch(err => console.error('更新エラー:', err));
        });
      });

      // 削除ボタン操作
      tableBody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (currentAdmin.role !== "運営") return;
          const docId = btn.dataset.id;
          if (!confirm("本当に削除しますか？")) return;
          db.collection('shops').doc(docId).delete()
            .then(() => loadShops())
            .catch(err => console.error('削除エラー:', err));
        });
      });

    })
    .catch(err => console.error('取得エラー:', err));
}

// ------------------------
// 承認/未承認/全件切り替え
// ------------------------
document.getElementById('toggleApproved').addEventListener('click', () => {
  if (showFilter === "all") showFilter = "unapproved";
  else if (showFilter === "unapproved") showFilter = "approved";
  else showFilter = "all";

  const btn = document.getElementById('toggleApproved');
  btn.textContent = showFilter === "all" ? '全件表示' :
                    showFilter === "unapproved" ? '未承認のみ表示' :
                    '承認済みのみ表示';
  loadShops();
});
