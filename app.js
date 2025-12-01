// ===============================
// Firebase 初期化
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyCkzIDMtm8HI2Q3VGG7wkV7gybVNL_4Uc4",
  authDomain: "workout-app-78f56.firebaseapp.com",
  projectId: "workout-app-78f56",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ===============================
// 地図初期設定（札幌駅周辺）
// ===============================
let map = L.map('map').setView([43.0687, 141.3508], 14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let shops = [];
let markers = [];

// ===============================
// 星評価で色分け
// ===============================
function getMarkerColor(rating) {
  const r = Math.floor(rating);
  if (r < 3) return "green";
  if (r < 4) return "blue";
  return "yellow";
}

// ===============================
// アイコン
// ===============================
function getColoredIcon(color) {
  return L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
}

// ===============================
// 営業時間判定
// ===============================
function isOpenNow(hours) {
  if (!hours) return true;
  const sep = hours.includes("〜") ? "〜" : "~";
  if (!hours.includes(sep)) return true;
  const [startStr, endStr] = hours.split(sep);
  const now = new Date();
  const start = new Date();
  const end = new Date();
  const [sh, sm] = startStr.split(":").map(Number);
  const [eh, em] = endStr.split(":").map(Number);
  start.setHours(sh, sm, 0);
  end.setHours(eh, em, 0);
  if (end < start) return now >= start || now <= end;
  return now >= start && now <= end;
}

// ===============================
// 今日の曜日（日本語）
// ===============================
function getTodayYoubi() {
  const youbiList = ["日","月","火","水","木","金","土"];
  return youbiList[new Date().getDay()];
}

// ===============================
// マーカー作成
// ===============================
function createMarkers(filter="all", search="", category="all") {
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  const today = getTodayYoubi();

  shops.forEach(shop => {
    if (filter !== "all" && Math.floor(shop.rating) !== parseInt(filter)) return;
    if (category !== "all" && shop.category !== category) return;
    if (search && !shop.name.includes(search)) return;

    const isHoliday = shop.holiday && shop.holiday.includes(today);
    let color = "black";
    if (!isHoliday) color = isOpenNow(shop.hours) ? getMarkerColor(shop.rating) : "black";

    const marker = L.marker([shop.lat, shop.lng], { icon: getColoredIcon(color) }).addTo(map);

    let popup = `<h3>${shop.name}</h3>
                 <p><strong>詳細:</strong> ${shop.details}</p>
                 <p><strong>接客:</strong> ${shop.service}</p>`;
    if (isHoliday) {
      popup += `<p style="color:red;"><strong>本日定休日</strong></p>`;
    } else {
      popup += `<p><strong>営業時間:</strong> ${shop.hours}</p>`;
      popup += `<p><strong>定休日:</strong> ${shop.holiday.join("・")}</p>`;
    }
    popup += `<p><strong>評価:</strong> ${shop.rating}</p>`;
    if (shop.url) {
      popup += `<button onclick="window.open('${shop.url}','_blank')">詳しく</button>`;
    }
    marker.bindPopup(popup);
    markers.push(marker);
  });
}

// ===============================
// Firestore 取得（承認済みのみ）
// ===============================
db.collection('shops')
  .where('approved', '==', true)
  .onSnapshot(snapshot => {
    const firestoreShops = snapshot.docs.map(doc => doc.data());
    // JSONデータと結合
    shops = [...shops.filter(s => !s.fromFirestore), ...firestoreShops.map(s => ({ ...s, fromFirestore: true }))];
    createMarkers();
  }, error => console.error("Firestore取得エラー:", error));

// ===============================
// JSON 読み込み
// ===============================
fetch('shops.json')
  .then(res => res.json())
  .then(data => {
    shops = [...data.map(s => ({ ...s, fromFirestore: false }))];
    createMarkers();
  })
  .catch(err => console.error("JSON読み込みエラー:", err));

// ===============================
// 検索・フィルター
// ===============================
document.getElementById('searchInput').addEventListener('input', e => {
  createMarkers(document.getElementById('filterSelect').value, e.target.value, document.getElementById('categorySelect').value);
});
document.getElementById('filterSelect').addEventListener('change', e => {
  createMarkers(e.target.value, document.getElementById('searchInput').value, document.getElementById('categorySelect').value);
});
document.getElementById('categorySelect').addEventListener('change', e => {
  createMarkers(document.getElementById('filterSelect').value, document.getElementById('searchInput').value, e.target.value);
});

// ===============================
// 現在地
// ===============================
document.getElementById('locateBtn').addEventListener('click', () => {
  map.locate({ setView: true, maxZoom: 16 });
  map.once('locationfound', e => L.marker(e.latlng).addTo(map).bindPopup("現在地").openPopup());
  map.once('locationerror', () => alert("現在地を取得できませんでした"));
});

// ページ読み込み時にアップデート中ならprokisi.htmlに移動
const isUpdating = false; // trueならアップデート中、falseなら通常画面
if (isUpdating) {
  window.location.href = "purokisi.html"; // 更新ページに誘導
}
