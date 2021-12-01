function loadMovies() {
    var parent = document.getElementById("image-container")
    for(let i=0; i<5; i++) {
        url = localStorage['Movie' + String(i)]
        var div = document.createElement("div")
        div.setAttribute("class", "col-xs-4 col-sm-3 col-md-2 nopad text-center")
        var label = document.createElement("label")
        label.setAttribute("class", "image-checkbox")
        label.setAttribute("id", url)
        var image = document.createElement("img")
        image.setAttribute("class", "img-responsive")
        image.setAttribute("src", url)
        label.appendChild(image)
        var i = document.createElement("i")
        i.setAttribute("class", "fa fa-check hidden")
        label.appendChild(i)
        div.appendChild(label)
        parent.appendChild(div)
    }
}