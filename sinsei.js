// ===== Firebase 初期化 =====
const firebaseConfig = {
  apiKey: "AIzaSyCkzIDMtm8HI2Q3VGG7wkV7gybVNL_4Uc4",
  authDomain: "workout-app-78f56.firebaseapp.com",
  projectId: "workout-app-78f56",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ===== マップ初期化 =====
let map = L.map('map').setView([43.0687, 141.3508], 14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

let marker;
map.on('click', (e) => {
  const lat = e.latlng.lat;
  const lng = e.latlng.lng;

  document.getElementById('lat').value = lat;
  document.getElementById('lng').value = lng;

  if (marker) marker.remove();
  marker = L.marker([lat, lng]).addTo(map);
});

// ===== 送信処理 =====
document.getElementById('send').addEventListener('click', async () => {
  const name = document.getElementById('name').value;
  const lat = Number(document.getElementById('lat').value);
  const lng = Number(document.getElementById('lng').value);
  const category = document.getElementById('category').value;
  const details = document.getElementById('details').value;
  const service = document.getElementById('service').value;
  const hours = document.getElementById('hours').value;
  const holiday = document.getElementById('holiday').value.split(','); // カンマ区切り
  const rating = Number(document.getElementById('rating').value);
  const url = document.getElementById('url').value;

  if (!name || !lat || !lng) {
    alert("店名・座標は必須です");
    return;
  }

  const data = {
    name,
    lat,
    lng,
    category,
    details,
    service,
    hours,
    holiday,
    rating,
    url,
    approved: false, // 管理者が承認するまで false
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    await db.collection('shops').add(data);
    alert('申請を送信しました');
    // 送信後にフォームをリセット
    document.getElementById('shopForm').reset();
    if (marker) marker.remove();
  } catch (e) {
    console.error(e);
    alert('送信中にエラーが発生しました');
  }
});

// ページ読み込み時にアップデート中なら移動
const isUpdating = false; // trueならアップデート中　falseならアップデート完了
if (isUpdating) {
  // sinseiフォルダから見たパス
  window.location.href = "sinsei.purokisi.html";
}