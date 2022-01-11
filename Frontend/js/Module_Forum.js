/*---------------------------------YAHOO---------------------------------------*/
//Hanterar charten
export function chartMain(label, data, index) {
  const down = (ctx, value) =>
    ctx.p0.parsed.y > ctx.p1.parsed.y ? value : undefined;

  const chartData = {
    labels: label,
    datasets: [
      {
        label: `${index}`,
        backgroundColor: 'rgba(2, 200, 250, 0.05)',
        borderColor: 'rgb(2, 200, 250)',
        borderWidth: 0.7,
        segment: {
          borderColor: (ctx) => down(ctx, 'rgb(2, 200, 250)'),
          backgroundColor: (ctx) => down(ctx, 'rgb(2, 200, 250, 0.05)'),
        },
        data: data, //Data för värden
      },
    ],
  };

  const chartConfig = {
    type: 'line',
    data: chartData,
    options: {
      fill: true,
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      radius: 0,
      stacked: false,
      plugins: {
        title: {
          // redigerar titel över charten
          display: false,
          text: '',
          color: 'rgb(120, 120, 120)',
          font: {
            //Font size and styling
            size: 10,
            family: 'Merriweather, serif',
          },
          padding: {
            top: 10,
            bottom: 0,
          },
        },
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          //Redigerar labels under charten, tid i fallet med index/stonks
          ticks: {
            display: false,
          },
          grid: {
            display: false,
            drawBorder: true,
            drawOnChartArea: true,
            drawTicks: true,
            color: 'rgb(120, 120, 120)',
          },
        },
        y1: {
          //Redigerar labels för y axeln, d.v.s. datan
          type: 'linear',
          display: false,
          position: 'right',
          // grid line settings
          ticks: {
            display: true,
            font: {
              //Font size and styling
              size: 10,
              family: 'Merriweather, serif',
            },
          },
          grid: {
            drawOnChartArea: true, // only want the grid lines for one axis to show up
            color: 'rgba(30, 30, 30, 0.7)',
            z: -1,
          },
        },
      },
    },
  };

  if (window.mainChart instanceof Chart) {
    window.mainChart.destroy();
    window.mainChart = new Chart(
      document.getElementById('chartMainForum'),
      chartConfig
    );
  } else {
    window.mainChart = new Chart(
      document.getElementById('chartMainForum'),
      chartConfig
    );
  }
}

/*---------------------------------LOGIN---------------------------------------*/
//Login 
export function userLogin(data) {
  fetch('/forum/user/login', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
    },
  })
  .then((response) => {
    if (response.status === 202) {
      window.location.href = '/';
    } else if (response.status === 401) {
      let div = document.querySelector('#loginAlert');
      div.style.display = 'flex';
      div.innerHTML =
        'Fel angivet användarnamn och/eller lösenord, försök igen!';
    } else {
      throw new Error(`Ett oväntat fel har uppståt ${response.status}`);
    }
  })
  .catch((error) => {
    console.log(error);
  });
}

//Create user 
export function userCreate(data) {
  fetch('/forum/user/create', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
    },
  })
  .then((response) => {
    
    if (response.status === 201) {
      let div = document.querySelector('#createAlertSucc');
      document.querySelector('#createAlert').style.display = 'none';
      div.style.display = 'flex';
      div.innerHTML = 'Ditt konto är nu skapat!';

      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } else if (response.status === 401) {
      let div = document.querySelector('#createAlert');
      div.style.display = 'flex';
      div.innerHTML = 'Det valda användarnamnet finns redan, vänligen välj ett annat!';
    } else {
      throw new Error(`Ett oväntat fel har uppståt ${response.status}`);
    }
  })
  .catch((error) => {
    console.log(error);
  });
}

//Uppdate password 
export function userUppdate(data) {
  fetch('/forum/user/uppdate', {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
    },
  })
    .then((response) => { 
      if (response.status === 201) {
        document.querySelector('#chaPassAlert').style.display = 'none';
        let div = document.querySelector('#chaPassAlertSucc');
        div.style.display = 'flex';
        div.innerHTML = 'Ditt lösenord är nu uppdaterat!';
        setTimeout(()=> {
          //Stänger allert message och rensar value
          div.style.display = 'none';
            document.querySelector('#OldpassWord').value = '';
            document.querySelector('#NewpassWord').value = '';
            document.querySelector('#NewpassWordRep').value = '';
            document.querySelector('#backToLogin').click();
        }, 2000)
      } else if (response.status === 401) {
        let div = document.querySelector('#chaPassAlert');
        div.style.display = 'flex';
        div.innerHTML = 'Fel angivet befintligt lösenord, försök igen!';
      } else {
        throw new Error(`Ett oväntat fel har uppståt ${response.status}`);
      }
    })
    .catch((error) => {
      console.log(error);
    });
}

/*-------------------------------INTERACTION--------------------------------*/
//Hanterar kommentarer och nya trådar 
export function newThreadModule(host, data) {
  return new Promise((resolve) => {
    fetch(`/${host}`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
    })
    .then((response) => {
      if (response.status === 201) {
        resolve(window.location = '/');
      } else if (response.status === 202) {
        resolve();
      } else if (response.status === 403) {
        throw new Error(
          alert(
            'Inloggning saknas, alt. input innehåller ogiltig material/ämne!'
          )
        );
      } else if (response.status === 404) {
        //Visa alert om att tråden verkar ha blivit borttagen
        let toastLive = document.querySelector('#liveToast');
        document.querySelector('#alertDiv').style.display = 'flex';
        document.querySelector('#alertLeft').innerHTML =
          'Denna tråd tycks vara borttagen, försök att uppdatera hemsidan och/eller skapa en ny tråd!';
        let toast = new bootstrap.Toast(toastLive);
        toast.show();

        //Återför tidigare value i comment inp
        document.querySelector('#commentText').value = data.text;
      } else {
        throw new Error(`Ett oväntat fel har uppståt ${response.status}`);
      }
    })
    .catch((error) => {
      console.log(error);
    });
  });
}

/*-------------------------------------STYLE-------------------------------*/
//Ger style till inlagg btn i profil
export function styleInlagg(){

  let btn1 = document.querySelector('.profilHead1');
  let btn2 = document.querySelector('.profilHead2');
  let div1 = document.querySelector('.threadDivRightOff');
  let div2 = document.querySelector('.likesDivRightOff');

  btn1.style.backgroundColor = 'rgba(32, 32, 32, 0.253)';
  btn1.style.color = 'rgb(220, 220, 220)';
  div1.style.display = 'flex'

  btn2.style.backgroundColor = 'rgb(0, 0, 0)';
  btn2.style.color = 'rgb(60, 60, 60)';
  div2.style.display = 'none';
}

//Ger style till likes btn i profil
export function styleLikes() {
  let btn1 = document.querySelector('.profilHead1');
  let btn2 = document.querySelector('.profilHead2');
  let div1 = document.querySelector('.threadDivRightOff');
  let div2 = document.querySelector('.likesDivRightOff');

  btn2.style.backgroundColor = 'rgba(32, 32, 32, 0.253)';
  btn2.style.color = 'rgb(220, 220, 220)';
  div2.style.display = 'flex';

  btn1.style.backgroundColor = 'rgb(0, 0, 0)';
  btn1.style.color = 'rgb(60, 60, 60)';
  div1.style.display = 'none';
}

//Ger style till vald thread 
export function colorThread(thr){
  //Tar bot style från tidigare Thread title
  document.querySelectorAll('.threadDiv').forEach((element) => {
    element.style.backgroundColor = 'black';
    element.style.borderRadius = 'none';
    element.style.color = 'rgb(119, 119, 119)';
    element.style.textDecoration = 'none';
  });
  //Tar bot style från tidigare Thread datum
  document.querySelectorAll('.threadDate').forEach((element) => {
    element.style.color = 'rgb(61, 61, 61)';
  });

  //Ger style till valda Thread
  let select = document.getElementById('thr' + thr);
  select.style.backgroundColor = 'rgba(32, 32, 32, 0.35)';
  select.style.borderRadius = '0.5rem';
  select.style.color = 'rgb(226, 226, 226)';
  select.style.textDecoration = '0.1rem underline rgba(39, 39, 39, 0.7)';
}

//Ger style till vald subject 
export function colorSubject(sub){
  //variael för width
  const width =
  window.innerWidth ||
  document.documentElement.clientWidth ||
  document.body.clientWidth;

  let element = document.getElementById('sub' + sub);

  //Tar bot style från tidigare index
  document.querySelectorAll('.subjectP').forEach((element) => {
    element.style.backgroundColor = 'black';
    element.style.borderRadius = 'none';
    element.style.color = 'rgb(119, 119, 119)';
    element.style.textDecoration = 'none';
  });

  //Ger style till valda index
  element.style.backgroundColor = 'rgb(20, 20, 20)';
  element.style.borderRadius = '0.5rem';
  element.style.color = 'rgb(226, 226, 226)';
  element.style.textDecoration = 'underline';

  //Ändrar header namn till valt index
  if (width < 992) {
    document.querySelector('#subjectHeader').innerHTML = element
      .getAttribute('name')
      .toUpperCase();
    //Ändra thread header till ticker symbol på mindre skärmar
    document.querySelector('#threadHeaderSM').innerHTML = element
      .getAttribute('name')
      .toUpperCase();
  } else {
    document.querySelector('#subjectHeader').innerHTML = element.textContent;

    //Lägg till ticker symbol i thread header
    document.querySelector('#tickerLG').innerHTML = element
      .getAttribute('name')
      .toUpperCase();
  }

  //gör kommentarsknappen tillgänglig
  if (sessionStorage.getItem('user') !== null) {
    document.querySelector('#modal1Btn').disabled = false;
  }
}