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

}