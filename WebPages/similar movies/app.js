var actor = null
var genre = null
var coactor = null
var rating = null
var language = null
var duration = null
var stat=null
var data=null
var config = { headers: {  
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,DELETE,PUT'}
}
 
function fixProb()
{
     
        $(".image-checkbox").on("click", function (e) {
          $(this).toggleClass('image-checkbox-checked');
          var $checkbox = $(this).find('input[type="checkbox"]');
          $checkbox.prop("checked", !$checkbox.prop("checked"))

          e.preventDefault();
        });
      
}
function loading(){
    document.getElementById('tc').setAttribute("class","text-center");
    document.getElementById('spb').setAttribute("class","spinner-border");
    document.getElementById('sr1').setAttribute("class","sr-only");
    document.getElementById('sr1').innerHTML="ML Modelling....Loading Predictions....";
    runML();
}
function getSimilarMovies() {
    if (localStorage['actor']!='null'){actor = localStorage['actor']} else{actor=null}
    if (localStorage['genre']!='null'){genre = localStorage['genre']} else{genre=null}
    if (localStorage['coactor']!='null'){coactor = localStorage['coactor']} else{coactor=null}
    if (localStorage['rating']!='null'){rating = localStorage['rating']} else{rating=null}
    if (localStorage['language']!='null'){language = localStorage['language']} else{language=null}
    if (localStorage['duration']!='null'){duration = localStorage['duration']} else{duration=null}
    post_data = {"genre": genre, "actor": actor, "coactor": coactor, "rating": rating, "language": language, "duration": duration}
    console.log(post_data)
    axios.post('http://localhost:8082/getFilmIDS/',JSON.stringify(post_data),config)
        .then(response => {
            data = response.data;
            console.log(`POST request sent with`, post_data);
            console.log(`Received response: `, data);
            appendImages(data);
            stat=1;
            
        })
        .catch(error => console.error(error));
        
       /*appendImages( ['tt0187115', 'tt0214853', 'tt0437084', 'tt1283956', 'tt1305803', 'tt1308015', 'tt1579526', 'tt1582560', 'tt1704144'])*/
}

function changeState(element) {
    var parent = element.parentElement
    
    if (parent.getAttribute("class") == "image-checkbox") {
        
        parent.setAttribute("class", "image-checkbox image-checkbox-checked")
    } else if (parent.getAttribute("class") == "image-checkbox image-checkbox-checked") {
        
        parent.setAttribute("class", "image-checkbox")
    }
}
function appendImages(images) {
    var parent = document.getElementById("image-container")
    images.forEach(element => {
        url = "https://s3bucket1abhinaav.s3.us-west-1.amazonaws.com/IMDB_Posters/imdb_" + element + ".png";
        var div = document.createElement("div")
        div.setAttribute("class", "col-xs-4 col-sm-3 col-md-2 nopad text-center")
        var label = document.createElement("label")
        label.setAttribute("class", "image-checkbox")
        label.setAttribute("id", url)
        var image = document.createElement("img")
        image.setAttribute("class", "img-responsive")
        image.setAttribute("src", url)
        image.setAttribute("onerror", "this.onerror=null; this.style.display = 'none'")
        image.setAttribute("onclick","changeState(this)")
        label.appendChild(image)
        var input = document.createElement("input")
        input.setAttribute("type", "checkbox")
        label.append(input)
        var i = document.createElement("i")
        i.setAttribute("class", "fa fa-check hidden")
        label.appendChild(i)
        div.appendChild(label)
        parent.appendChild(div)
    });    
}
function getSelections() {
    var elements = document.querySelectorAll(".image-checkbox-checked");
    console.log("You selected %s elements", elements.length)
    result = []
    for (var i = 0; i < elements.length; i++) {
        result.push(elements[i].id); 
    }
    console.log(result)
    return result
}

function runML() {
    similar_movies = getSelections()
    var mlCall={"filter":{"genre": genre, "actor": actor, "coactor": coactor, "rating": rating, "language": language,"duration":duration},"similarMovies":similar_movies};
    axios.post('http://localhost:8081/runML/',JSON.stringify(mlCall),config)
        .then(response => {
            const data = response.data;
            console.log(`POST request sent with`, post_data);
            console.log(`Received response: `, data);
            for(let i=0; i<data.length; i++) {
                localStorage['Movie' + String(i)] = data[i]
            }
            /*doccument.getElementById('pbar').setAttribute('style',"width:100%;");
            document.getElementById('runComplete').innerHTML="Model Build! Rendering Predictions Now...";
            setTimeout(function (){},2000);*/

            window.location.href = "../FinalResult/index.html";
        })
        .catch(error => console.error(error));
}