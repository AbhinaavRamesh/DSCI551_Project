var config = { headers: {  
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,DELETE,PUT'}
}

const importNewDataset = () => {
    var csv_path = document.getElementById("input_csv").value;
    var csv_path = csv_path.split("\\").pop()
    post_data = {"csv_path":csv_path}

    axios.post('http://localhost:8082/import_new_data/', JSON.stringify(post_data),config)
    .then(response => {
        const data = response.data;});

    listDatasets();
    
}

const listDatasets = () => {

    post_data = {}
    axios.get('http://localhost:8081/list_datasets/', JSON.stringify(post_data),config)
    .then(response => {
        const data = response.data.data;

        console.log(data);

        var table_body = document.getElementById("myTableData");
        table_body.innerHTML = "";

        var table = document.getElementById("myTableData");
        for (var i = 0; i < data.length; i++){
            var tr = document.createElement('tr');   
        
            var td1 = document.createElement('td');
            var td2 = document.createElement('td');

            var a = document.createElement('a');
            var linkText = document.createTextNode("Dataset "+data[i][0].toString());
            a.appendChild(linkText);
            a.href = "http://localhost:8080/view_dataset_page/"+data[i][0].toString();
        
            var text2 = document.createTextNode(data[i][1]);
        
            td1.appendChild(a);
            td2.appendChild(text2);
            tr.appendChild(td1);
            tr.appendChild(td2);
        
            table.appendChild(tr);
        }
    });

}