var actor = null
var genre = null
var coactor = null
var rating = null
var language = null
var duration=null
var GenreGraphData=[]
var ActorGraphData=[]
var DurationGraphData=[]
var RatingsGraphData=[]
var config = { headers: {  
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,DELETE,PUT'}
}
function saveChoices() {
    localStorage['actor'] = actor
    localStorage['genre'] = genre
    localStorage['coactor'] = coactor
    localStorage['rating'] = rating
    localStorage['language'] = language
    localStorage['duration'] = duration
};
function setActor() {
    actor = localStorage['actor']
    document.getElementById('actor-title').innerHTML = "ACTOR: " + actor 
	// Update the counter
	document.getElementById("actors-counter").innerHTML = 1
    populateData()
    
}
function setGenreGraph() {
    Highcharts.chart('container-genre', {
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie'
        },
        title: {
            text: '# of Movies in Each Genre'
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        accessibility: {
            point: {
                valueSuffix: '%'
            }
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                }
            }
        },
        series: [{
            name: 'Movies',
            colorByPoint: true,
            data: GenreGraphData
        }]
    });
}
function setActorGraph(){
Highcharts.chart('container-actor', {
    chart: {
        type: 'column'
    },
    title: {
        text: 'Max Actors in Selected Genre'
    },
    subtitle: {
        text: ''
    },
    xAxis: {
        type: 'category',
        labels: {
            rotation: -45,
            style: {
                fontSize: '13px',
                fontFamily: 'Verdana, sans-serif'
            }
        }
    },
    yAxis: {
        min: 0,
        title: {
            text: 'Movies Count'
        }
    },
    legend: {
        enabled: false
    },
    tooltip: {
        pointFormat: 'No of Movies: <b>{point.y:.1f} #</b>'
    },
    series: [{
        name: 'Movies Count',
        data: ActorGraphData,
        dataLabels: {
            enabled: true,
            rotation: -90,
            color: '#FFFFFF',
            align: 'right',
            format: '{point.y:.1f}', // one decimal
            y: 10, // 10 pixels down from the top
            style: {
                fontSize: '13px',
                fontFamily: 'Verdana, sans-serif'
            }
        }
    }]
});}
function setDurationGraph(){
    Highcharts.chart('container-duration', {
        title: {
            text: 'Histogram for Duration of movies'
        },
    
        xAxis: [{
            title: { text: 'Movie Length Ranges' },
            alignTicks: false
        }, {
            title: { text: 'Histogram' },
            alignTicks: false,
            opposite: true
        }],
    
        yAxis: [{
            title: { text: 'Data' }
        }, {
            title: { text: 'Histogram' },
            opposite: true
        }],
    
        plotOptions: {
            histogram: {
                accessibility: {
                    point: {
                        valueDescriptionFormat: '{index}. {point.x:.3f} to {point.x2:.3f}, {point.y}.'
                    }
                }
            }
        },
    
        series: [{
            name: 'Histogram',
            type: 'histogram',
            xAxis: 1,
            yAxis: 1,
            baseSeries: 's1',
            zIndex: -1
        }, {
            name: 'Data',
            type: 'scatter',
            data: DurationGraphData,
            id: 's1',
            marker: {
                radius: 1.5
            }
        }]
    });

}
function setRatingsGraph(){
    Highcharts.chart('container-ratings', {
        chart: {
            type: 'pyramid3d',
            options3d: {
                enabled: true,
                alpha: 10,
                depth: 50,
                viewDistance: 50
            }
        },
        title: {
            text: 'Distribution of Ratings'
        },
        plotOptions: {
            series: {
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b> ({point.y:,.0f})',
                    allowOverlap: true,
                    x: 10,
                    y: -5
                },
                width: '60%',
                height: '80%',
                center: ['50%', '45%']
            }
        },
        series: [{
            name: 'No of Movies',
            data: RatingsGraphData
        }]
    });
}
function setDefaults(parent) {
	var option = document.createElement('option');
	option.text = "Select Option"
	option.selected = false
	option.hidden = true
	parent.appendChild(option)
}

function genreSelect() {
    genre = document.getElementById('genre-dropdown').value
    populateData()
}

function coactorSelect() {
    coactor = document.getElementById('coactor-dropdown').value
    populateData()
}

function ratingSelect() {
    rating = document.getElementById('rating-dropdown').value
    populateData()
}

function languageSelect() {
    language = document.getElementById('language-dropdown').value
    populateData()
}

const populateData = () => {
    post_data = {"genre": genre, "actor": actor, "coactor": coactor, "rating": rating, "language": language,"duration":null}
    axios.post('http://localhost:8080/get_filtered_values/', JSON.stringify(post_data),config)
        .then(response => {
            const data = response.data;
            console.log(`POST request sent with`, post_data);
            console.log(`Received response: `, data);
            // Process data
            appendToGenre(data.genres)
            if (data.coactors != null){
                appendToCoActor(data.coactors)}
            appendToRating(data.ratings)
            appendToLanguage(data.languages)
            appendToDuration(data.durations)
			// Update the movies counter
			document.getElementById("movies-counter").innerHTML = parseInt(data.movieCnt)
        })
        .catch(error => console.error(error));
    axios.post('http://localhost:8081/genre_graph/', JSON.stringify(post_data),config)
            .then(response => {
                const data = response.data;
                console.log(`POST request sent with`, post_data);
                console.log(`Received response: `, data);
                // Process data
                GenreGraphData=data.data
                console.log(GenreGraphData);
                setGenreGraph()
                
            })
            .catch(error => console.error(error));
    axios.post('http://localhost:8082/actor_graph/', JSON.stringify(post_data),config)
            .then(response => {
                const data = response.data;
                console.log(`POST request sent with`, post_data);
                console.log(`Received response: `, data);
                // Process data
                ActorGraphData=data.data
                setActorGraph()
                
                
                
            })
            .catch(error => console.error(error));
    axios.post('http://localhost:8083/duration_graph/', JSON.stringify(post_data),config)
            .then(response => {
                const data = response.data;
                console.log(`POST request sent with`, post_data);
                console.log(`Received response: `, data);
                // Process data
                DurationGraphData=data.data
                setDurationGraph()
                
                
            })
            .catch(error => console.error(error));
    axios.post('http://localhost:8083/ratings_graph/', JSON.stringify(post_data),config)
            .then(response => {
                const data = response.data;
                console.log(`POST request sent with`, post_data);
                console.log(`Received response: `, data);
                // Process data
                RatingsGraphData =data.data
                setRatingsGraph()
                
                
                
            })
            .catch(error => console.error(error));
            

    };
    function durationSelect() {
        duration = document.getElementById('duration-dropdown').value
        populateData()
    }
function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}
const appendToDuration = (durations) => {
    var dropdown = document.getElementById("duration-dropdown");
    removeAllChildNodes(dropdown);
	if (durations.length > 1) {
		setDefaults(dropdown)
	}
    //iterate over all durations
    for(var i = 0; i < durations.length; i++) {
        var option = document.createElement('option');
        option.text = option.value = durations[i];
        dropdown.appendChild(option);
    }
};

const appendToGenre = (genres) => {
    var dropdown = document.getElementById("genre-dropdown");
    removeAllChildNodes(dropdown);
	if (genres.length > 1) {
		setDefaults(dropdown)
	}
    //iterate over all genres
    for(var i = 0; i < genres.length; i++) {
        var option = document.createElement('option');
        option.text = option.value = genres[i];
        dropdown.appendChild(option);
    }
	// Update the counter
	document.getElementById("genres-counter").innerHTML = parseInt(genres.length)
};

const appendToCoActor = (coactors) => {
    var dropdown = document.getElementById("coactor-dropdown");
    removeAllChildNodes(dropdown);
	if (coactors.length > 1) {
		setDefaults(dropdown)
	}
    //iterate over all co-actors
    for(var i = 0; i < coactors.length; i++) {
        var option = document.createElement('option');
        option.text = option.value = coactors[i];
        dropdown.appendChild(option);
    }
};

const appendToRating = (ratings) => {
    var dropdown = document.getElementById("rating-dropdown");
    removeAllChildNodes(dropdown);
	if (ratings.length > 1) {
		setDefaults(dropdown)
	}
    //iterate over all ratings
    for(var i = 0; i < ratings.length; i++) {
        var option = document.createElement('option');
        option.text = option.value = ratings[i];
        dropdown.appendChild(option);
    }
};

const appendToLanguage = (languages) => {
    var dropdown = document.getElementById("language-dropdown");
    removeAllChildNodes(dropdown);
	if (languages.length > 1) {
		setDefaults(dropdown)
	}
    //iterate over all ratings
    for(var i = 0; i < languages.length; i++) {
        var option = document.createElement('option');
        option.text = option.value = languages[i];
        dropdown.appendChild(option);
    }
	// Update the counter
	document.getElementById("languages-counter").innerHTML = parseInt(languages.length)
};