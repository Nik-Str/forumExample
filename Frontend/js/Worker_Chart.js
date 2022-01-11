onmessage = (index) => {
  let symbol = index.data;
  //Fetch Index data
  fetch('/data/index')
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error(
          `Ett oväntat fell har uppstått ${response.status}`
        );
      }
    })
    .then((response) => {
      postMessage(response.find((x) => x.id === symbol));
    })
    .catch((error) => {
      console.log(error);
    });
};
