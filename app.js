var actor = null
var genre = null
var coactor = null
var rating = null
var language = null
var duration = null
var config = { headers: {  
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,DELETE,PUT'}
}

function getSimilarMovies() {
    actor = (localStorage['actor']) ?  (localStorage['actor']) : null
    genre = (localStorage['genre']) ?  (localStorage['genre']) : null
    coactor = (localStorage['coactor']) ?  (localStorage['coactor']) : null
    rating = (localStorage['rating']) ?  (localStorage['rating']) : null
    language = (localStorage['language']) ?  (localStorage['language']) : null
    duration = (localStorage['duration']) ?  (localStorage['duration']) : null
    post_data = {"genre": genre, "actor": actor, "coactor": coactor, "rating": rating, "language": language, "duration": duration}
    axios.post('http://localhost:5000/getFilmIDS/',JSON.stringify(post_data),config)
        .then(response => {
            const data = response.data;
            console.log(`POST request sent with`, post_data);
            console.log(`Received response: `, data);
            appendImages(data)
        })
        .catch(error => console.error(error));
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
    axios.post('http://localhost:5000/runML/',JSON.stringify(mlCall),config)
        .then(response => {
            const data = response.data;
            console.log(`POST request sent with`, post_data);
            console.log(`Received response: `, data);
            for(let i=0; i<5; i++) {
                localStorage['Movie' + String(i)] = data[0]
            }
        })
        .catch(error => console.error(error));
}