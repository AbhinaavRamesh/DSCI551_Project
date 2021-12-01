var config = { headers: {  
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,DELETE,PUT'}
}
const getGenreAndActorData = () => {
    post_data = {"genre": null, "actor": null, "coactor": null, "rating": null, "language": null,"duration":null}
    console.log(JSON.stringify(post_data))
    axios.post('http://localhost:8080/get_filtered_values/',JSON.stringify(post_data),config)
        .then(response => {
            const data = response.data;
            console.log(`GET request sent. Received response: `, data);
            // Process data
            appendToGenre(data.genres);
            appendToActor(data.actors)
        })
        .catch(error => console.error(error));
};

const appendToGenre = (genres) => {
    var select = document.getElementById("Genres");
    //iterate over all genres
    for(var i = 0; i < genres.length; i++) {
        var option = document.createElement('option');
        option.text = option.value = genres[i];
        select.appendChild(option);
    }
};

const appendToActor = (actors) => {
    var select = document.getElementById("Actors");
    //iterate over all actors
    for(var i = 0; i < actors.length && i<50; i++) {
        var option = document.createElement('option');
        option.text = option.value = actors[i];
        select.appendChild(option);
    }
};

document.getElementById("genre-button").addEventListener("click", function() {
    var select = document.getElementById("Genres")
    localStorage['genre'] = select.value
});

document.getElementById("actor-button").addEventListener("click", function() {
    var select = document.getElementById("Actors")
    localStorage['actor'] = select.value
});