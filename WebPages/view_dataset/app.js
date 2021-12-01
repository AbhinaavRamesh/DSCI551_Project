var config = { headers: {  
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,DELETE,PUT'}
}

const importDataset = (dataset_id) => {
    var csv_path = document.getElementById("input_csv").value;
    var csv_path = csv_path.split("\\").pop()
    post_data = {"csv_path":csv_path, "dataset_id":dataset_id}

    // console.log(nameValue)

    axios.post('http://localhost:5000/import_additional_data/', JSON.stringify(post_data),config)
    .then(response => {
        const data = response.data;});

    viewDataset(dataset_id);
}

const viewDataset = (dataset_id) => {
    console.log("inside view dataset");
    post_data = {}
    axios.get('http://localhost:5000/view_dataset/'+dataset_id, JSON.stringify(post_data),config)
    .then(response => {
    
        const data = response.data.data;
        console.log(data);

        // var table_body = document.getElementById("table_body");
        // table_body.innerHTML = "";
        var tb = $('#example').DataTable();
        tb.clear().draw();
        tb.destroy();

        var table = document.getElementById("table_body");
        for (var i = 0; i < data.length; i++){
            var tr = document.createElement('tr');   
            
            var td1 = document.createElement('td');
            var td2 = document.createElement('td');
            var td3 = document.createElement('td');
            var td4 = document.createElement('td');
            var td5 = document.createElement('td');
            var td6 = document.createElement('td');
            var td7 = document.createElement('td');
            var td8 = document.createElement('td');
            var td9 = document.createElement('td');
            var td10 = document.createElement('td');

        
            var text1 = document.createTextNode(data[i][0]);
            var text2 = document.createTextNode(data[i][1]);
            var text3 = document.createTextNode(data[i][2]);
            var text4 = document.createTextNode(data[i][3]);
            var text5 = document.createTextNode(data[i][4]);
            var text6 = document.createTextNode(data[i][5]);
            var text7 = document.createTextNode(data[i][6]);
            var text8 = document.createTextNode(data[i][7]);
            var text9 = document.createTextNode(data[i][8]);
            var text10 = document.createTextNode(data[i][9]);

        
            td1.appendChild(text1);
            td2.appendChild(text2);
            td3.appendChild(text3);
            td4.appendChild(text4);
            td5.appendChild(text5);
            td6.appendChild(text6);
            td7.appendChild(text7);
            td8.appendChild(text8);
            td9.appendChild(text9);
            td10.appendChild(text10);
            tr.appendChild(td1);
            tr.appendChild(td2);
            tr.appendChild(td3);
            tr.appendChild(td4);
            tr.appendChild(td5);
            tr.appendChild(td6);
            tr.appendChild(td7);
            tr.appendChild(td8);
            tr.appendChild(td9);
            tr.appendChild(td10);
        
            table.appendChild(tr);
        }

        $(document).ready(function() {
            $('#example').DataTable();
            } );
    });

    

}

const streamProducer = () => {
    console.log("inside producer");
    post_data = {}
    axios.post('http://localhost:5000/stream_producer/', JSON.stringify(post_data),config)
}

const streamConsumer = (dataset_id) => {
    console.log("inside consumer");
    post_data = {}
    axios.post('http://localhost:5000/stream_consumer/'+dataset_id, JSON.stringify(post_data),config)
    
    viewDataset(dataset_id);
}