import {
  newThreadModule,
  chartMain,
  userUppdate,
  userLogin,
  userCreate,
  colorThread,
  colorSubject,
  styleInlagg,
  styleLikes,
} from './Module_Forum.js';

/*------------------------------------Diverse----------------------------------*/
//"Globala" variabler
let global_login = false;
let global_userName;
let global_Sub_Name;
let global_Sub_id;
let global_Thr_Name;
let global_Thr_id;
let global_Con_id;

//Function som ordnar windows på mindre skärmar
const width =
  window.innerWidth ||
  document.documentElement.clientWidth ||
  document.body.clientWidth;
function checkScreenSize(){
  if (width < 992){
    let fragment = document.createDocumentFragment();
    fragment.appendChild(document.querySelector('#indexDiv'));
    document.querySelector('#SubjectOffDIv').appendChild(fragment);

    fragment.appendChild(document.querySelector('#threadDivContainer'));
    document.querySelector('#offCanvasThread').appendChild(fragment);
  }
}
checkScreenSize();

//lägger till username i profile window 
function checkUser() {
  fetch('/forum/controll', {
    method: 'GET',
  })
  .then((response) => {
    if(response.status === 202){
      return response.json();
    } else if (response.status === 204) {
      document.querySelector('#modal2Btn').disabled = true;
    }
  })
  .then((response) => {
     if(response !== undefined){
       global_userName = response['user'];
       document.querySelector('#profilBtn').style.display = 'block';
       document.querySelector('#userName').innerHTML = response['user'];
       document.querySelector('#modalBtn').style.display = 'none';
       document.querySelector('#modal2Btn').disabled = false;

       //Ändrar knappar längst ner på mindre skärmar
       if (width < 992) {
         document.querySelector('#tradBtn').style.width = '25%';
         document.querySelector('#amneBtn').style.width = '25%';
         document.querySelector('#inlaggBtn').style.width = '25%';
         document.querySelector('#amneBtn').style.marginLeft = '25%';
         document.querySelector('#tradBtn').style.marginRight = '25%';
       }
       //Ändrar variabeln Global_login till true
       global_login = true;
     }
  })
  .catch((err) => {
    console.log(err);
  });
}
checkUser();

/*----------------------------------------Yahoo----------------------------------*/
//Headerdata
function getIndexData() {
  fetch('/data/header')
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error(
          `Ett oväntat fel har uppstått ${response.status}`
        );
      }
    })
    .then((response) => {
      for (let i = 0; i < 10; i++) {
        document.getElementById('indexC' + [i]).innerHTML =
          response[i].regularMarketPrice;

        let result = response[i].regularMarketPreviousClose;

        if (result > 0) {
          let DiffDiv = document.querySelector('#indexD' + [i]);
          DiffDiv.innerHTML = '+' + result + '%';
          DiffDiv.style.color = 'rgb(2, 220, 86)';
        } else if (result < 0) {
          let DiffDiv = document.querySelector('#indexD' + [i]);
          DiffDiv.innerHTML = result + '%';
          DiffDiv.style.color = 'rgb(250, 2, 2)';
        } else {
          let DiffDiv = document.querySelector('#indexD' + [i]);
          DiffDiv.innerHTML = result + '%';
        }
      }
      document.querySelector('#dateIndex').innerHTML = response[10].date;

      //Onclick function för att ändra chart
      document.querySelectorAll('.indexDiv').forEach(element => {
        element.addEventListener('click', () => {
          getChart(element.id);
        })
      });
    })
    .catch((error) => {
      console.log(error);
    });
}
getIndexData();
setInterval(() => {
  getIndexData();
}, 60000);

// Main chart
function getChart(index) {
  if (window.Worker) {
    const worker = new Worker('../js/Worker_Chart.js');
    worker.postMessage(index);

    worker.onmessage = (response) => {
      let labels = response.data.time;
      let data = response.data.close;

      chartMain(labels, data, index);
    };

    worker.onerror = (error) => {
      console.log(error);
    };
  } else {
    console.log("Your browser doesn't support web workers.");
  }
}
getChart('^OMX');

/*--------------------------------------FORUM-------------------------------------*/
//Hämtar subject:
function subjectXhr(){

  fetch('/forum/subject', {
    method: 'GET'
  })
  .then((response) => {
    if (response.status === 201) {
      return response.json();
    } else if (response.status === 204) {
      throw new Error(`Forumet är tomt ${response.status}`);
    } else {
      throw new Error(`Ett oväntat fel har inträffat ${response.status}`);
    }
  })
  .then((response) => {

    //Renderar ut subject i div
    for (let i = 0; i < response.length; i++) {
      document.querySelector('#indexDiv').innerHTML += `
    <p id="${'sub' + response[i]['id']}" class="subjectP" name="${
        response[i]['ticker']
      }"}">${response[i]['index']}</p>
    `;
    }

    //Function som väljer och ändrar data på subject
    document.querySelectorAll('.subjectP').forEach((element) => {
      element.addEventListener('click', async () => {
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

        //Rensar potentiellt tidigare data i Globala variabler
        global_Sub_Name = '';
        global_Sub_id = '';
        global_Thr_Name = '';
        global_Thr_id = '';
        global_Con_id = '';

        //Ändrar Thread data
        await threadXhr({ id: element.id.substring(3) });

        //Lägg till name på index i global var för komment inp
        global_Sub_Name = element.textContent;
        global_Sub_id = element.id.substring(3);

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
          document.querySelector('#subjectHeader').innerHTML =
            element.textContent;

          //Lägg till ticker symbol i thread header
          document.querySelector('#tickerLG').innerHTML = element
            .getAttribute('name')
            .toUpperCase();
        }

        //gör kommentarsknappen ej tillgänglig
        document.querySelector('#modal1Btn').disabled = true;

        //Gör knapp för att hämta nästa 10 inlägg ej tillgänglig
        document.querySelector('#conBtn').style.display = 'none';

        //På mindra skärmar hoppar den till Thread
        if (width < 992) {
          document.querySelector('#closeSubjectBtn').click();
          setTimeout(() => {
            document.querySelector('#tradBtn').click();
          }, 1000);
        }
      });
    });
  })
  .catch((error) => {
    console.log(error);
  });
}
subjectXhr();

//Get thread 
function threadXhr(data) {
  return new Promise((resolve, reject) => {
    //Renser thread för ny data
    document.querySelector('#threadDivContainer').innerHTML = '';

    //Tar bort tidigare content
    document.querySelector('#forumContent').innerHTML = '';

    //Hämtar thread data
    fetch('/forum/get/thread', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
    })
      .then((response) => {
        if (response.status === 201) {
          return response.json();

        } else if (response.status === 404) {
          //Visa alert om att tråden verkar ha blivit borttagen
          let toastLive = document.querySelector('#liveToast');
          document.querySelector('#alertDiv').style.display = 'flex';
          document.querySelector('#alertLeft').innerHTML =
            'Den valda aktien tycks sakna trådar/vara borttagen, uppdatera hemsidan och försök igen!';
          let toast = new bootstrap.Toast(toastLive);
          toast.show();
          throw new Error(
            `Den valda aktien tycks sakna trådar/vara borttagen! Status: ${response.status}`
          );
        } else {
          throw new Error(`Ett oväntat fel har uppståt ${response.status}`);
        }
      })
      .then((response) => {
        //Renser thread för ny data så att det ej buggar med dubletter.
        document.querySelector('#threadDivContainer').innerHTML = '';

        //rendera ut thread
        let div = document.querySelector('#threadDivContainer');
        for (let i = 0; i < response.length; i++) {
          div.innerHTML += `
        <div class="threadDiv" id="${'thr' + response[i]['id']}"> 
        <p class="threadTitle">${response[i]['title']}</p>
        <p class="threadDate">${response[i]['date']}</p>
        </div>`;
        }

        //Function som väljer och ändrar data för thread på click
        document.querySelectorAll('.threadDiv').forEach((element) => {
          element.addEventListener('click', () => {
            //Tar bort tidigare content
            document.querySelector('#forumContent').innerHTML = '';

            //gör kommentarsknappen tillgänglig
            if (global_login === true) {
              document.querySelector('#modal1Btn').disabled = false;
            }

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
            element.style.backgroundColor = 'rgba(32, 32, 32, 0.35)';
            element.style.borderRadius = '0.5rem';
            element.style.color = 'rgb(226, 226, 226)';
            element.style.textDecoration =
              '0.1rem underline rgba(39, 39, 39, 0.7)';

            //Lägger till den valda thread id i global variabel för komments input
            global_Thr_id = element.id.substring(3);
            global_Thr_Name =
              element.querySelector('.threadTitle').textContent;

            //Ändrar / väljer content content
            contentXhr({ thread: element.id.substring(3), beg: 9, end: 0 });

            //Stänger thread offdiv på mindre skärmar efter val
            if (width < 992) {
              document.querySelector('#closeThreadBtn').click();
            }
          });
        });
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
}

//Get content 
function contentXhr(data, next) {
  return new Promise((resolve, reject) => {

    fetch('/forum/get/content', {
      method: 'POST',
      body: JSON.stringify({
        key: data['thread'],
        beg: data['beg'],
        end: data['end'],
      }),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
    })
      .then((response) => {
        if (response.status === 201) {
          return response.json();

        } else if (response.status === 204) {
          document.querySelector('#conBtn').style.display = 'none';
          return undefined;
        } else {
          throw new Error(`Ett oväntat fel har uppståt ${response.status}`);
        }
      })
      .then((response) => {
        if(response !== undefined){
          if (next === 'next') {
          } else {
            //Tar bort tidigare content så att det ej buggar med dubletter.
            document.querySelector('#forumContent').innerHTML = '';
          }

          //renderar ut content
          for (let i = 0; i < response.length; i++) {
            document.querySelector('#forumContent').innerHTML += `
            <div class="contentDiv" id="${response[i]['id']}">
              <p class="contentUser">${response[i]['user']}</p>
              <p class="contentText">${response[i]['text']}</p>
              <div class="contentEditDiv">
                <div>
                  <p class="contentDate">${response[i]['date']}</p>
                </div>
                <div class="editDiv">
                  <div class="eeedit ">
                    <span name="${response[i]['id']}" class="material-icons likeBtn">thumb_up</span>
                    <p>${response[i]['likes']}</p>
                  </div>
                  <div class="uppdate">

                  </div>
                </div>
              </div>
            </div>`;
          }

          //Funktion för att lika inlägg
          document.querySelectorAll('.likeBtn').forEach((element) => {
            element.addEventListener('click', () => {
              if (global_userName !== undefined) {
                fetch('/forum/like', {
                  method: 'PUT',
                  body: JSON.stringify({
                    key: element.getAttribute('name'),
                  }),
                  headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                  },
                })
                  .then((response) => {
                    if (response.status === 201) {
                      element.style.color = 'rgb(180, 180, 180)';
                      let div = element.parentElement;
                      div.querySelector('p').innerHTML =
                        parseInt(div.querySelector('p').innerHTML) + 1;
                    } else if (response.status === 202) {
                      let toastLive = document.querySelector('#liveToast');
                      document.querySelector('#alertDiv').style.display =
                        'flex';
                      document.querySelector('#alertLeft').innerHTML =
                        'Du gillar redan detta inlägg!';
                      let toast = new bootstrap.Toast(toastLive);
                      toast.show();
                    } else if (response.status === 404) {
                      //Visa alert om att tråden verkar ha blivit borttagen
                      let toastLive = document.querySelector('#liveToast');
                      document.querySelector('#alertDiv').style.display =
                        'flex';
                      document.querySelector('#alertLeft').innerHTML =
                        'Denna kommentar tycks vara borttagen, uppdatera tråden eller hemsidan och försök igen!';
                      let toast = new bootstrap.Toast(toastLive);
                      toast.show();
                    } else {
                      throw new Error(
                        alert(
                          `Ett oväntat fel har uppståt ${response.status}, vänligen försök igen`
                        )
                      );
                    }
                  })
                  .catch((error) => {
                    console.log(error);
                  });
              } else {
                let toastLive = document.querySelector('#liveToast');
                document.querySelector('#alertDiv').style.display = 'flex';
                document.querySelector('#alertLeft').innerHTML =
                  'Inloggning krävs för att kommentera, skapa och gilla inlägg!';
                let toast = new bootstrap.Toast(toastLive);
                toast.show();
              }
            });
          });

          //Lägger till edit funktion
          document.querySelectorAll('.contentDiv').forEach((element) => {
            let name = element.querySelector('.contentUser').textContent;

            if (name === global_userName) {
              let div = element.querySelector('.contentEditDiv');

              div
                .querySelector('.editDiv')
                .querySelector('.uppdate').innerHTML =
                '<span class="material-icons" data-bs-target="#exampleModalToggle1" data-bs-toggle="modal">more_horiz</span>';

              //Function som möjliggör editering av egna inlägg samt att kunna ta bort dessa
              div
                .querySelector('.editDiv')
                .querySelector('.uppdate')
                .addEventListener('click', () => {
                  //Lägger till tidigare text i textarea
                  let textField = document.querySelector('#uppdateText');
                  //Rensar fältet från eventuellt tidigare input
                  textField.value = '';
                  // Adderar valda content text för editering
                  textField.value +=
                    element.querySelector('.contentText').textContent;

                  //Lägger till content id i uppdate input
                  global_Con_id = element.id;
                });
            }
          });

          //Gör knappen för att hämta fler rader i content tillgänglig
          if (response.length >= 9) {
            let btn = document.querySelector('#conBtn');
            btn.style.display = 'block';
            btn.setAttribute('name', data['thread']);
          } else {
            document.querySelector('#conBtn').style.display = 'none';
          }
          resolve();
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

//Funktion som hämtar 10 inlägg åt gången vid längre trådar
document.querySelector('#conBtn').addEventListener('click', () => {
  let end = document.querySelectorAll('.contentDiv').length;
  contentXhr({ thread: global_Thr_id, beg: 10, end: end }, 'next')
});

//Funktion som hämtar left offvanvas data, d.v.s senast aktiva trådar
function getLastActiveThread() {
  fetch('/forum/whatsnew', {
    method: 'GET'
  })
    .then((response) => {
      if (response.status === 201) {
        return response.json();
      } else {
        throw new Error(
          `Ett oväntat fel har uppstått ${response.status}`
        );
      }
    })
    .then((data) => {
      //Avgär vilken div som datan ska vara i, skiljer sig på mindre skärmar
      let leftOffDiv;
      if(width < 992) {
        leftOffDiv = document.querySelector('.threadDivLeftOff');
      } else {
        leftOffDiv = document.querySelector('#latestActive');
      }
      //rensar dig innan rendering
      leftOffDiv.innerHTML = '';

      //Renderar ut latest
      for (let i = 0; i < data.length; i++) {
        leftOffDiv.innerHTML += `
        <div class="leftOffDiv">
            <p class="leftOffIndex" name="${data[i]['sub_id']}">${data[i]['sub_index']}</p>
            <p class="leftOffThread" name="${data[i]['thread_id']}">${data[i]['thread_title']}</p>
            <p class="leftOffContent" >${data[i]['content_name']}</p>
            <p class="leftOffDate">${data[i]['content_date']}</p>
        </div>
        `;
      }

      //Onclick function för data i left offvanvas div
      document.querySelectorAll('.leftOffDiv').forEach((element) => {
        element.addEventListener('click', async () => {
          let subID = element
            .querySelector('.leftOffIndex')
            .getAttribute('name');
          let subName = element.querySelector('.leftOffIndex').textContent;
          let thrID = element
            .querySelector('.leftOffThread')
            .getAttribute('name');
          let thrName = element.querySelector('.leftOffThread').textContent;

          //Stänger left off på mindre skärmar
          if (width < 990) {
            document.querySelector('#closeLatestBtn').click();
          }

          //Väljer index
          await threadXhr({ id: subID });

          //Scrollar till det valda index i meny
          if (width > 992) {
            let first = document.querySelector('.subjectP').offsetTop;
            let topPos =
              document.getElementById('sub' + subID).offsetTop - first;
            document.querySelector('#divLeft').scrollTop = topPos;
          }

          //ger style till valda index
          colorSubject(subID);

          //Hämtar content
          await contentXhr({ thread: thrID, beg: 9, end: 0 });

          //Tar bort tidigare style samt ger style till vald thread
          colorThread(thrID);

          //Scrollar till det valda thread i meny
          if (width > 992) {
            let first1 = document.querySelector('.threadDiv').offsetTop;
            let topPos1 =
              document.getElementById('thr' + thrID).offsetTop - first1;
            document.querySelector('#threadDivRight').scrollTop = topPos1;
          }

          //Lägger till subject och thread i global var
          global_Sub_Name = subName;
          global_Sub_id = subID;
          global_Thr_Name = thrName;
          global_Thr_id = thrID;

          //gör kommentarsknappen tillgänglig
          if (global_login === true) {
            document.querySelector('#modal1Btn').disabled = false;
          }
        });
      });
    })
    .catch((error) => {
      console.log(error);
    });
}
getLastActiveThread();

/*------------------------------------INTERACTION--------------------------------*/
//Function som gör submit knappen tillgänglig vid nya post
document.querySelectorAll('#newText, #newThre, #newSub').forEach((element) => {
  element.addEventListener('keyup', () => {
    let sub = document.querySelector('#newSub').value;
    let thre = document.querySelector('#newThre').value;
    let text = document.querySelector('#newText').value;
    let btn = document.querySelector('#newThreadBTN');

    if (sub !== '' && thre !== '' && text !== '') {
      btn.disabled = false;
    } else {
      btn.disabled = true;
    }
  });
});

//Skickar nya post till DB
document.querySelector('#newThreadBTN').addEventListener('click', async () => {
  //Kontrollerar inlogg (mest för att undvika buggar)
  if (global_login === true){
    let subID = document.querySelector('#newSub').getAttribute('name');
    let sub = document.querySelector('#newSub').value;
    let thre = document.querySelector('#newThre').value;
    let text = document.querySelector('#newText').value;

    //Fixar så att första bokstaden i thread alltid börjar med uppercase
    function fixUpp(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }

    let sendTo = {
      thread: fixUpp(thre),
      text: text,
      subjectID: subID,
      subject: sub,
    };

    //Rensar och stänger modalfält
    document.querySelector('#newSub').value = '';
    document.querySelector('#newThre').value = '';
    document.querySelector('#newText').value = '';

    document.querySelector('#exampleModalToggle2').style.display = 'none';
    document.querySelector('.modal-backdrop').style.display = 'none';

    //Skickar ny post till server
    await newThreadModule('forum/newthread', sendTo);
  }
});

//Function som gör submit knapp tillgänglig vi kommentarer
document.querySelector('#commentText').addEventListener('keyup', () => {
  let text = document.querySelector('#commentText').value;
  let btn = document.querySelector('#commentBTN');

  if (text !== '') {
    btn.disabled = false;
  } else {
    btn.disabled = true;
  }
});

//Kommenterar befintlig post och skickar till DB
document.querySelector('#commentBTN').addEventListener('click', async () => {
  //Kontrollerar inlogg samt att samtliga variabler för sub och thr innehåller värden. (mest för att undvika buggar)
  if (
    global_login === true &&
    global_Sub_Name !== '' &&
    global_Sub_id !== '' &&
    global_Thr_Name !== '' &&
    global_Thr_id !== ''
  ) {
    let text = document.querySelector('#commentText').value;

    let data = {
      subName: global_Sub_Name,
      subId: global_Sub_id,
      thrName: global_Thr_Name,
      thrId: global_Thr_id,
      text: text,
    };

    //Rensar och stänger modalfält
    document.querySelector('#commentText').value = '';

    //Skickar ny kommentar till server och hämtar om tråden på nytt
    await newThreadModule('forum/newcomment', data);
    document.querySelector('#forumContent').innerHTML = '';
    contentXhr({ thread: global_Thr_id, beg: 10, end: 0 });
  } 
});

/*-----------------------------------------LOGIN-----------------------------------*/
//växla till ny användare 
document.querySelector('#newUserBtn').addEventListener('click', () => {
  document.querySelector('#newUserContainer').style.display = 'block';
  document.querySelector('#LoginContainer').style.display = 'none';
  document.querySelector('#staticBackdropLabel').innerHTML = 'NY ANVÄNDARE';
});

//växla till login
document.querySelector('#loginBtn').addEventListener('click', () => {
  document.querySelector('#newUserContainer').style.display = 'none';
  document.querySelector('#LoginContainer').style.display = 'block';
  document.querySelector('#staticBackdropLabel').innerHTML = 'LOG IN';
});

//Skapa ny användare
document.querySelector('#CreateUserBtn').addEventListener('click', () => {
  let userName = document.querySelector('#newUserName').value;
  let userPass = document.querySelector('#NewUserPassWord').value;
  let userPassRet = document.querySelector('#NewUserPassWordRep').value;
  let userCheck = userName.match(/[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g);

  // Så samtliga fält är ifylda och username inte innehåller några special tecken
  if (
    userName !== '' &&
    userPass !== '' &&
    userPassRet !== '' &&
    userCheck === null
  ) {
    // KOntrollera så lösnorden stämmer överrrens
    if (userPass === userPassRet) {
      //lägg till function med kontroll för krav på tecken och komplexitet
      let letmatch = userPass.match(/[a-z]/g);
      let digmatch = userPass.match(/[0-9]/g);
      let sigmatch = userPass.match(
        /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g
      );

      if (
        letmatch !== null &&
        digmatch !== null &&
        sigmatch !== null &&
        userPass.length > 8
      ) {
        let sendTo = { name: userName, pass: userPass };
        userCreate(sendTo);
      } else {
        let div = document.querySelector('#createAlert');
        div.style.display = 'flex';
        div.innerHTML =
          'Lösenordets längd måste överstiga 8 samt innehålla både bokstäver, siffror och tecken!';
      }
    } else {
      let div = document.querySelector('#createAlert');
      div.style.display = 'flex';
      div.innerHTML = 'Lösenorden stämmer ej överrens med varandra!';
    }
  } else {
    let div = document.querySelector('#createAlert');
    div.style.display = 'flex';
    div.innerHTML =
      'Användarnamn får enbart innehålla a-z, A-Z samt siffror 0-9!';
  }
});

//Logga in
document.querySelector('#loginUserBtn').addEventListener('click', () => {
  let userName = document.querySelector('#userLoginName').value;
  let userPass = document.querySelector('#passLoginWord').value;

  if (userName !== '' && userPass !== '') {
    let sendTo = { name: userName, pass: userPass };
    userLogin(sendTo);
  }
});

//Loggar ut
document.querySelector('#logOutBtn').addEventListener('click', () => {
  window.location.href = '/forum/user/logout';
});

//function som byter till change password window och tillbaka till profil 
document.querySelector('#changePBtn').addEventListener('click', () => {
  document.querySelector('#changeP').style.display = 'block';
  document.querySelector('#profilDiv').style.display = 'none';
});
document.querySelector('#backToLogin').addEventListener('click', () => {
  document.querySelector('#changeP').style.display = 'none';
  document.querySelector('#profilDiv').style.display = 'block';
});

//Ändrar lösenord
document.querySelector('#changePSubmit').addEventListener('click', () => {
  let oldPass = document.querySelector('#OldpassWord').value;
  let userPass = document.querySelector('#NewpassWord').value;
  let userPassRet = document.querySelector('#NewpassWordRep').value;

  //KOntrollerar så samtliga fält innnehåller något
  if (oldPass !== '' && userPass !== '' && userPassRet !== '') {
    
    //Kontrollerar så lösenorden stämmer överrens med varandra
    if (userPass === userPassRet) {

      //Kontrollerar krav på special teckan samt siffror för lösenord
      let letmatch = userPass.match(/[a-z]/g);
      let digmatch = userPass.match(/[0-9]/g);
      let sigmatch = userPass.match(
        /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g
      );

      if (
        letmatch !== null &&
        digmatch !== null &&
        sigmatch !== null &&
        userPass.length > 8
      ) {
        let sendTo = {
          pass: userPass,
          old: oldPass,
        };
        userUppdate(sendTo);
      } else {
        let div = document.querySelector('#chaPassAlert');
        div.style.display = 'flex';
        div.innerHTML =
          'Lösenordets längd måste överstiga 8 samt innehålla både bokstäver, siffror och tecken. Kan inte innehålla bokstäverna å,ä,ö!';
      }
    } else {
      let div = document.querySelector('#chaPassAlert');
      div.style.display = 'flex';
      div.innerHTML = 'Lösenorden stämmer ej överrens med varandra!';
    }
  } else {
    let div = document.querySelector('#chaPassAlert');
    div.style.display = 'flex';
    div.innerHTML = 'Ange ett giltigt löseord!';
  }
});

/*----------------------------------------PROFIL----------------------------------*/
//Hämtar senaste inläggen kopplat till anvädaren
document.querySelectorAll('#profilBtn, .profilHead1').forEach((element) => {
  element.addEventListener('click', () => {
    // Ger style till btn som väljer inlägg eller likes
    styleInlagg();

    //Hämtar senaste inlägg kopplat till anvädanre
    fetch('/forum/userPost', {
      method: 'GET',
    })
      .then((response) => {
        if (response.status === 201) {
          return response.json();
        }  else {
          throw new Error(`Ett oväntat fel har uppståt ${response.status}`);
        }
      })
      .then((data) => {
        if (data['key'] !== null) {
          document.querySelector('.threadDivRightOff').innerHTML = '';

          //Renderar ut senaste user post
          for (let i = 0; i < data.length; i++) {
            document.querySelector('.threadDivRightOff').innerHTML += `
      <div class="rightOffDiv" name="${data[i]['subID']}">
          <p class="rightOffSubject" >${data[i]['subName']}</p>
          <p class="rightOffThread" >${data[i]['thrName']}</p>
          <p class="rightOffContent" name="${data[i]['thrID']}">${data[i]['conText']}</p>
          <p class="rightOffDate" name="${data[i]['conID']}">${data[i]['conDate']}</p>
      </div>
      `;
          }

          //Onclick function för data i left offvanvas div
          document.querySelectorAll('.rightOffDiv').forEach((element) => {
            element.addEventListener('click', async () => {
              //Hämtar id på subject och thread
              let sub = element.getAttribute('name');
              let thr = element
                .querySelector('.rightOffContent')
                .getAttribute('name');

              //Stänger profil off
              document.querySelector('#closeProfilBtn').click();

              //Väljer index
              await threadXhr({ id: sub });

              //Scrollar till det valda index i meny
              if (width > 992) {
                let first = document.querySelector('.subjectP').offsetTop;
                let topPos =
                  document.getElementById('sub' + element.getAttribute('name'))
                    .offsetTop - first;
                document.querySelector('#divLeft').scrollTop = topPos;
              }

              //ger style till valda index
              colorSubject(sub);

              //Hämtar content
              await contentXhr({ thread: thr, beg: 9, end: 0 });

              //Tar bort tidigare style samt ger style till vald thread
              colorThread(thr);

              //Scrollar till det valda thread i meny
              if (width > 992) {
                let first1 = document.querySelector('.threadDiv').offsetTop;
                let topPos1 =
                  document.getElementById('thr' + thr).offsetTop - first1;
                document.querySelector('#threadDivRight').scrollTop = topPos1;
              }

              //gör kommentarsknappen tillgänglig
              if (global_login === true) {
                document.querySelector('#modal1Btn').disabled = false;

                //Lägger till subject och thread i global var
                global_Sub_Name = element.querySelector('.rightOffSubject').textContent;
                global_Sub_id = sub;
                global_Thr_Name = element.querySelector('.rightOffThread').textContent;
                global_Thr_id = thr;
              }
            });
          });
        }
      })
      .catch((error) => {
        console.log('Error while fetching current IndexData:', error);
      });
  });
});

//Hämtar senaste gillade inlägg kopplat till användaren 
document.querySelector('.profilHead2').addEventListener('click', () => {
  // Ger style till btn som väljer inlägg eller likes
  styleLikes();

  //hämtar senaste likes kopplat till användaren
  fetch('/forum/userlikes', {
    method: 'GET',
  })
    .then((response) => {
      if (response.status === 201) {
        return response.json();
      } else {
        throw new Error(`Ett oväntat fel har uppståt ${response.status}`);
      }
    })
  .then((response) => {
    if (response['key'] !== null) {
      document.querySelector('.likesDivRightOff').innerHTML = '';

      //Renderar ut senaste user likes
      for (let i = 0; i < response.length; i++) {
        document.querySelector('.likesDivRightOff').innerHTML += `
        <div class="rightOffDiv" name="${response[i]['subID']}">
            <p class="rightOffSubject" >${response[i]['subName']}</p>
            <p class="rightOffThread" >${response[i]['thrName']}</p>
            <p class="rightOffContent" name="${response[i]['thrID']}">${response[i]['conText']}</p>
            <p class="rightOffDate" name="${response[i]['conID']}">${response[i]['conDate']}</p>
        </div>
        `;
      }

      //Onclick function för data i left offvanvas div
      document.querySelectorAll('.rightOffDiv').forEach((element) => {
        element.addEventListener('click', async () => {
          let sub = element.getAttribute('name');
          let thr = element
            .querySelector('.rightOffContent')
            .getAttribute('name');

            //Stänger profil window
          document.querySelector('#closeProfilBtn').click();

          //Väljer index
          await threadXhr({ id: sub });

          //Scrollar till det valda index i meny
          if (width > 992) {
            let first = document.querySelector('.subjectP').offsetTop;
            let topPos =
              document.getElementById('sub' + element.getAttribute('name'))
                .offsetTop - first;
            document.querySelector('#divLeft').scrollTop = topPos;
          }

          //ger style till valda index
          colorSubject(sub);

          //Hämtar content
          await contentXhr({ thread: thr, beg: 9, end: 0 });

          //Tar bort tidigare style samt ger style till vald thread
          colorThread(thr);

          //Scrollar till det valda thread i meny
          if (width > 992) {
            let first1 = document.querySelector('.threadDiv').offsetTop;
            let topPos1 =
              document.getElementById('thr' + thr).offsetTop - first1;
            document.querySelector('#threadDivRight').scrollTop = topPos1;
          }

          //gör kommentarsknappen tillgänglig
          if (global_login === true) {
            document.querySelector('#modal1Btn').disabled = false;

            //Lägger till subject och thread i global var
            global_Sub_Name = element.querySelector('.rightOffSubject').textContent;
            global_Sub_id = sub;
            global_Thr_Name = element.querySelector('.rightOffThread').textContent;
            global_Thr_id = thr;
          }
        });
      });
    }
  })
  .catch((error) => {
    console.log(error);
  });
})

/*-----------------------------------------SEARCH---------------------------------*/
//Search function
document.querySelector('#searchBar').addEventListener('keyup', () => {
  //tar bort tidigare sökningar
  document.querySelector('#searchList').innerHTML = '';

  //Kontrollerar så sökning är giltig att skicka till server
  let value = document.querySelector('#searchBar').value;

  //Function som controllerar så inga special tecken matas in i search
  if (value !== '' && value.length > 2) {
    function check(data) {
      if (data.match(/[`!@#$%^&*()_+\=\[\]{};':"\\|,<>\/?~]/g)) {
        return true;
      } else {
        return false;
      }
    }
  
    if (check(value) === false) {
      fetch('/forum/search', {
        method: 'POST',
        body: JSON.stringify({
          search: value,
        }),
        headers: {
          'Content-type': 'application/json; charset=UTF-8',
        },
      })
        .then((response) => {
          if (response.status === 201) {
            return response.json();
          } else if (response.status === 403) {
            throw new Error(
              `Något gick fel i er sökning, försök igen! ${response.status}`
            );
          } else {
            throw new Error(`Ett oväntat fel har inträffat ${response.status}`);
          }
        })
        .then((response) => {
          if (response['key'] !== null) {
            //Tar bort tidigare sökning igen för att ej få dubletter
            document.querySelector('#searchList').innerHTML = '';

            //Renderar ut ny sökning
            for (let i = 0; i < response.length; i++) {
              document.querySelector('#searchList').innerHTML += `
            <li class="searchOption list-group-item" data-bs-dismiss="modal" name="${response[i]['id']}">${response[i]['subject']}</li>
            `;
            }
            //Adderar click funtion för att välja tråd och index
            document
              .querySelectorAll('.searchOption').forEach((element) => {
                element.addEventListener('click', async () => {
                  let sub = element.getAttribute('name');

                  //Lägg till det valda index i global var
                  global_Sub_Name = element.textContent;
                  global_Sub_id = sub;

                  //Väljer index
                  await threadXhr({ id: sub });

                  //Scrollar till det valda index i meny
                  if (width > 992) {
                    let first = document.querySelector('.subjectP').offsetTop;
                    let topPos =
                      document.getElementById('sub' + sub)
                        .offsetTop - first;
                    document.querySelector('#divLeft').scrollTop = topPos;
                  }

                  //ger style till valda index
                  colorSubject(sub);

                  //På mindra skärmar hoppar den till Thread
                  if (width < 992) {
                    document.querySelector('#closeSubjectBtn').click();
                    setTimeout(() => {
                      document.querySelector('#tradBtn').click();
                    }, 1000);
                  }

                  //Tar bort eventuell tidigare "hämta fler" knappen
                  document.querySelector('#conBtn').style.display = 'none';
                })
              })
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }
});

//Val av aktie funktion vid skapande av ny tråd
document.querySelector('#newSub').addEventListener('keyup', () => {
  //tar bort tidigare sökningar
  document.querySelector('#subjetInp').innerHTML = '';

  //Kontrollerar så sökning är giltig att skicka till server
  let value = document.querySelector('#newSub').value;
  if (value !== '' && value.length > 2) {
    function check(data) {
      if (data.match(/[`!@#$%^&*()_+\=\[\]{};':"\\|,<>\/?~]/g)) {
        return true;
      } else {
        return false;
      }
    }

    if (check(value) === false) {
      fetch('/forum/select', {
        method: 'POST',
        body: JSON.stringify({
          search: value,
        }),
        headers: {
          'Content-type': 'application/json; charset=UTF-8',
        },
      })
      .then((response) => {
        if (response.status === 201) {
          return response.json();
        } else {subjetInp
          throw new Error(`Ett oväntat fel har inträffat ${response.status}`);
        }
      })
      .then((response) => {
        if (response['key'] !== null) {
          //Tar bort tidigare sökning igen för att ej få dubletter
          document.querySelector('#subjetInp').innerHTML = '';

          //Renderar ut ny sökning
          for (let i = 0; i < response.length; i++) {
            document.querySelector('#subjetInp').innerHTML += `
          <li class="selectOption list-group-item" id="${'sel'+response[i]['id']}" value="${response[i]['subject']}">${response[i]['subject']}</li>
          `;
          }

          //adderar click funtion för search resultat
          document.querySelectorAll('.selectOption').forEach((element) => {
            element.addEventListener('click', () => {
              //Ger input element value
              document.querySelector('#newSub').value = element.innerHTML;
              document.querySelector('#newSub').disabled = true;
              document.querySelector('#newSub').setAttribute('name', element.id.substring(3));
              //stänger sök listan
              document.querySelector('#subjetInp').style.display = 'none';

              //Visar resterade inputfält
              document.querySelector('#newTForum').style.display = 'block';
              document.querySelector('#newTFoot').style.display = 'flex';
              //Ändrar storleken på modal fönster
            })
          })

        }
      })
      .catch((error) => {
        console.log(error);
      });
    }
  }
});

/*---------------------------------------EDIT---------------------------------*/
//Funktion för att uppdatera inlägg
document.querySelector('#uppdateBtn').addEventListener('click', () => {
  let text = document.querySelector('#uppdateText').value;

  fetch('/forum/uppdate', {
    method: 'PUT',
    body: JSON.stringify({
      key: global_Con_id,
      uppdate: text,
    }),
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
    },
  })
    .then( async (response) => {
      if (response.status === 201) {
        //Lägger tillfälligt in den nya texten
        document.getElementById(global_Con_id).querySelector('.contentText').innerHTML = text;
      } else if (response.status === 403) {
        throw new Error(
          alert(
            'Ett fel har inträffat vid försök att uppdatera ditt inlägg, försök igen!'
          )
        );
      } else {
        throw new Error(
          alert(
            `Ett oväntat fel har uppståt ${response.status}, vänligen försök igen`
          )
        );
      }
    })
    .catch((error) => {
      console.log(error);
    });
});

//Function för att ta bort ett inlägg
document.querySelector('#deleteBtn').addEventListener('click', () => {

  fetch('/forum/delete', {
    method: 'DELETE',
    body: JSON.stringify({
      subId: global_Sub_id,
      thrId: global_Thr_id,
      conId: global_Con_id,
    }),
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
    },
  })
    .then((response) => {
      if (response.status === 200) {
        //Tar bort content
        document.getElementById(global_Con_id).remove();

      } else if (response.status === 202) {
        //Tar bort content och thread
        document.getElementById(global_Con_id).remove();
        document.getElementById('thr' + global_Thr_id).remove();

      } else if (response.status === 204) {
        //Tar bort content och thread samt subject
        document.getElementById(global_Con_id).remove();
        document.getElementById('thr' + global_Thr_id).remove();
        document.getElementById('sub' + global_Sub_id).remove();

      } else if (response.status === 403) {
        throw new Error(
          alert(
            'Ett fel har inträffat vid försök att ta bort ditt inlägg, försök igen!'
          )
        );
      } else {
        throw new Error(
          alert(
            `Ett oväntat fel har uppståt ${response.status}, vänligen försök igen`
          )
        );
      }
    })
    .catch((error) => {
      console.log(error);
    });
});

//Function som gör uppdate knapp tillgänglig vi uppdate
document.querySelector('#uppdateText').addEventListener('keyup', () => {
  let text = document.querySelector('#uppdateText').value;
  let btn = document.querySelector('#uppdateBtn');

  if (text !== '') {
    btn.disabled = false;
  } else {
    btn.disabled = true;
  }
});
