module.exports = (n) => {
  let Kategori = {
    1: {
      type: "Mobil",
      code: "C",
    },
    2: {
      type: "Motor",
      code: "M",
    },
    
    // 999: {
    //   type: "Lainnya",
    //   code: "LN",
    // },
  };

  return Kategori[n].code;
};
