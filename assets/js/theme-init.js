// Áp theme đã lưu trước khi vẽ trang để không nháy (mặc định: tối). File riêng thay cho script inline để CSP không cần 'unsafe-inline'.
(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();
