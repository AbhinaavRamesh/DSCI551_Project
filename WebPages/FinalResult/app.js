var config = { headers: {  
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,DELETE,PUT'}
}

function loadMovies() {
    console.log(JSON.stringify(localStorage['Movie0'])   )
    var parent = document.getElementById("image-container")
    for(let i=0; i<5; i++) {
        console.log('Movie' + String(i))
        console.log(localStorage['Movie' + String(i)])
        url = localStorage['Movie' + String(i)]
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
        div.appendChild(label)
        parent.appendChild(div)
    }

    display_features();

    localStorage.clear();

}

function display_features(){
    console.log("In display features");
    
    const title_ids = [];
    for(let i=0; i<5; i++) {
        // console.log('Movie' + String(i))
        // console.log(localStorage['Movie' + String(i)])
        url = localStorage['Movie' + String(i)]
        title_img = url.split("/")[4];
        title_id = title_img.split(".")[0];
        title_ids[i] = title_id.split("_")[1];
    }

    console.log(title_ids);

    post_data = {"data": title_ids};
    console.log(post_data);
    axios.post('http://localhost:8082/get_features/',JSON.stringify(post_data),config)
        .then(response => {
            data = response.data;
            console.log(data);

            var table = document.getElementById("table_body");

            Object.keys(data).forEach((key) => {
                // console.log(key,data[key]);

                var tr = document.createElement('tr');   
        
                var td1 = document.createElement('td');
                var td2 = document.createElement('td');
                
                var text1 = document.createTextNode(key);
                var text2 = document.createTextNode(data[key]);
            
                td1.appendChild(text1);
                td2.appendChild(text2);
                tr.appendChild(td1);
                tr.appendChild(td2);
            
                table.appendChild(tr);

            });

            $(document).ready(function() {
                $('#example').DataTable();
                } );
            
        })

}