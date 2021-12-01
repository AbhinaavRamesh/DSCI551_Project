#import findspark
#findspark.init()
from flask import Flask, request, jsonify, render_template
from pymongo import MongoClient
import pandas as pd
import ssl
import itertools
import matplotlib.pyplot as plt
from flask_cors import CORS,cross_origin
import numpy as np
import json
import string
import nltk
import datetime
import collections
import argparse
from pyspark.mllib.feature import HashingTF, IDF
from pyspark.context import SparkContext
from pyspark.sql.session import SparkSession
from pyspark.ml.feature import HashingTF, IDF, Tokenizer,StopWordsRemover
from pyspark.ml.feature import VectorAssembler
from pyspark.ml.feature import RobustScaler
from pyspark.ml.clustering import KMeans
from pyspark.ml.evaluation import ClusteringEvaluator
from scipy.signal import find_peaks
from skimage import io
from PIL import Image
from pyzbar.pyzbar import decode, ZBarSymbol
from pymongo import MongoClient
from nltk.corpus import stopwords
from pyspark import SparkConf
import matplotlib as mpl
mpl.use('Agg')
nltk.download('stopwords')
stop_words = list(set(stopwords.words()))
conf = SparkConf()#.set('spark.driver.memory', '4g').set('spark.executor.memory', '4g').set('spark.executor.memoryOverhead','8G')
sc = SparkContext("local")
spark = SparkSession(sc)
client=MongoClient("mongodb+srv://abhinaav:abhinaav@cluster0.rzzqy.mongodb.net/myFirstDatabase?retryWrites=true&w=majority")

import re
from time import sleep
from json import dumps, loads
from kafka import KafkaProducer, KafkaConsumer
import ast
app = Flask(__name__,template_folder='../WebPages/view_dataset/')
CORS(app,support_credentials=True)
FILE_PATH="/home/abhinaav/Project551/StreamData/"
def getData(req_json):
    #client = MongoClient("mongodb+srv://mukund:mukund@cluster0.nklch.mongodb.net/movie_recommendation?retryWrites=true&w=majority", ssl_cert_reqs=ssl.CERT_NONE)
    db = client['movie_recommendation']
    collection = db['Movie']
    filter_dict = {}
    if req_json['genre'] is not None:
        genre = req_json['genre']
        filter_dict["genre"] = { "$regex" : genre }
    
    if req_json['actor'] is not None and req_json['coactor'] is not None:
        actor = req_json['actor']
        coactor = req_json['coactor']
        filter_dict["$and"] = [{"actors":{"$regex" : actor}},{"actors":{"$regex" : coactor}}]
    elif req_json['actor'] is not None:
        actor = req_json['actor']
        filter_dict["actors"] = { "$regex" : actor }

    if req_json['language'] is not None:
        language = req_json['language']
        filter_dict["language"] = { "$regex" : language }
    
    if req_json['rating'] is not None:
        rating = req_json['rating']
        rating_dict = {"9+":[9,10],"7-9":[7,9],"5-7":[5,7],"<5":[0,5]}
        filter_dict["avg_vote"] = {"$gte":rating_dict[rating][0],"$lt":rating_dict[rating][1]}
    
    if req_json['duration'] is not None:
        duration = req_json['duration']
        duration_dict = {"<50 mins":[0,49],"50-100 mins":[50,99],"100-150 mins":[100,149],"150-200 mins":[150,199],">200 mins":[200]}
        if duration!=">200":
            filter_dict["duration"] = {"$gte":duration_dict[duration][0],"$lte":duration_dict[duration][1]}
        else:
            filter_dict["duration"] = {"$gte":duration_dict[duration][0]}
    print(filter_dict)
    print("Fetching Data from Mongo Server....")
    df = pd.DataFrame(list(collection.find(filter_dict)))
    print(df.shape)
    df = df.dropna()
    print(df.shape)
    return df

def getMLDB():
    print("Fetching MLDB archive from Mongo Server....")
    #client = MongoClient("mongodb+srv://mukund:mukund@cluster0.nklch.mongodb.net/movie_recommendation?retryWrites=true&w=majority", ssl_cert_reqs=ssl.CERT_NONE)
    db = client['movie_recommendation']
    collection = db['MLDB']
    df = pd.DataFrame(list(collection.find()))
    df = df.dropna()
    return df
    
def updateMLDB(record):
    #client = MongoClient("mongodb+srv://mukund:mukund@cluster0.nklch.mongodb.net/movie_recommendation?retryWrites=true&w=majority", ssl_cert_reqs=ssl.CERT_NONE)
    db = client['movie_recommendation']
    collection = db['MLDB']
    collection.insert_one(record)
  
def Clean_Columns(df,columns=['imdb_title_id', 'title', 'year', 'genre', 
             'duration','country', 'language', 'actors', 
             'avg_vote', 'votes', 'description', 'director']):
    for it in df.columns:
        if it not in columns:
            df=df.drop(it,axis=1)
    return df
def processSimilarMovies(similarMovies):
    #Image Processing
    #try:
        ls=[]
        for path in similarMovies:
            print("Decoding...",path)
            img=Image.fromarray(io.imread(path)[400:,80:-80])
            data=decode(img,symbols=[ZBarSymbol.QRCODE])[0].data
            ls.append(json.loads(data)['imdb_title_id'])
        return ls
    #except:
     #   return None

def ML_API(dictFilter,similarMovies=[]):
    #Connect to PyMongo and return DF
    similarMovies=processSimilarMovies(similarMovies)
    str1=""
    for it in similarMovies:
        str1+=it+", "
    dfData=getData(dictFilter)
    dfMLDB=getMLDB()
    if len(dfMLDB)>0:
        try:
            temp=dfMLDB.loc[(dfMLDB["FilterInfo"]==dictFilter) & (dfMLDB["lenData"]==len(dfData))& (dfMLDB["similarMovies"]==str1)] 
        except:
            return similarMovies
        # print(temp)
        # ls1=temp["similarMovies"]
        # import functools 
        # flag=True
        # for it in range(len(ls1)):
        #     ls=list(set(ls1[it]) - set(similarMovies))
        #     if len(ls)==0:
        #         temp=dfMLDB.iloc[it,:]
        #         flag=False
        
            
        #Check filterDict and len(Data)
        if len(temp)>0 :#and flag==False:
            print("Found previous instance for same Filters....")
            print("Returning Predictions...")
            ls2=list(temp["Recommendations"])
            if isinstance(ls2[0], str):
                return ls2
            else:
                return ls2[0]
            
    if len(dfData)<=10:
            print("Too few movies to cluster, returning original list....")
            return dfData['imdb_title_id']
    if len(dfData)>=0: 
        print("Pre-Processing Data....")
        fpdf=Clean_Columns(dfData)
        fpdf=fpdf.dropna()
        fpdf["TextColumns"]=fpdf['title']+" "+fpdf['title']+" "+fpdf['country']+" "+ fpdf['language']+" "+ fpdf['actors']+" "+fpdf['description']+" "+fpdf['director']
        dtypes={str:['imdb_title_id', 'title','description'],float:['year','duration','avg_vote', 'votes']}
        for it in dtypes:
            for x in dtypes[it]:
                fpdf[x]=fpdf[x].astype(it)
        fpdf = fpdf.loc[:,~fpdf.columns.duplicated()]
        sDF = spark.createDataFrame(fpdf)
        tokenizer = Tokenizer(inputCol="TextColumns", outputCol="words")
        wordsData = tokenizer.transform(sDF)
        #StopWordsRemover
        remover = StopWordsRemover(stopWords=stop_words)
        remover.setInputCol("words")
        remover.setOutputCol("words_cleaned")
        wordsData=remover.transform(wordsData)
        print("Computing TFIDF Features....")
        hashingTF = HashingTF(inputCol="words_cleaned", outputCol="rawFeatures", numFeatures=150)
        featurizedData = hashingTF.transform(wordsData)
        idf = IDF(inputCol="rawFeatures", outputCol="features")
        idfModel = idf.fit(featurizedData)
        rescaledData = idfModel.transform(featurizedData)
        processed_fpdf=rescaledData.toPandas()
        dict1={}
        for x,y,z in zip(list(processed_fpdf['words_cleaned']),list(processed_fpdf['rawFeatures']),list(processed_fpdf['features'])):
            for i,j in zip(x,zip(z.indices.tolist(),z.values.tolist())):
                if i not in dict1:
                    dict1[i]=j
                    #TextFeatures
        scored_features_tfidf={k: v for k, v in sorted(dict1.items(), key=lambda item: item[1][1],reverse=True)}
        print("Processing Features")
        feature_linker_dict={}
        for it in scored_features_tfidf:
            feature_linker_dict[scored_features_tfidf[it][0]]=it.strip(string.punctuation).replace(".","_").replace(" ","_").lower()
        cols_to_remove = []
        for col in processed_fpdf.columns:
            try:
                _ = processed_fpdf[col].astype(float)
            except ValueError:
                cols_to_remove.append(col)
                pass
        cols_to_remove.remove("imdb_title_id")
        import numpy as np
        a=np.array(list(processed_fpdf['features'])).T.tolist()
        for x in range(100):
            try:
                processed_fpdf["TFIDF_"+feature_linker_dict[x]]=a[x]
            except:
                pass
        for it in cols_to_remove:
            processed_fpdf=processed_fpdf.drop(it,axis=1)
        print("Transforming SparkDataFrame for Training....")
        final_data=spark.createDataFrame(processed_fpdf)
        cols=final_data.columns
        cols.remove("imdb_title_id")
        assemble=VectorAssembler(inputCols=cols, outputCol='features')
        assembled_data=assemble.transform(final_data)
        assembled_data=assembled_data.na.drop()
        scale=RobustScaler(inputCol='features',outputCol='standardized')
        data_scale=scale.fit(assembled_data)
        data_scale_output=data_scale.transform(assembled_data)
        print("Starting Clustering Algorithm.....")
        evaluator = ClusteringEvaluator(predictionCol='prediction', featuresCol='standardized',metricName='silhouette', distanceMeasure='squaredEuclidean')
        def eval_Clusters(i):
            KMeans_algo=KMeans(featuresCol='standardized', k=i,tol=0.00001, maxIter=100)
            KMeans_fit=KMeans_algo.fit(data_scale_output)
            output=KMeans_fit.transform(data_scale_output)
            score=evaluator.evaluate(output)
            return score
        silhouette_score= [eval_Clusters(i) for i in range(2,8)]
        try:
            peaks=find_peaks(silhouette_score)
            numClusters=list(peaks)[0][0]+2
        except:
            numClusters=5
        print("Choosing Optimal Cluster.....")
        KMeans_algo=KMeans(featuresCol='standardized', k=numClusters)
        KMeans_fit=KMeans_algo.fit(data_scale_output)
        output=KMeans_fit.transform(data_scale_output)
        score=evaluator.evaluate(output)
        print("Generating Predictions...")
        result_pdf=output.toPandas()
        recommendations=[]
        if len(similarMovies)>0:
            print("Finding Info from Selected Images for Similar Movies...")
            
            clustersConsidered=[]
            for it in similarMovies:
                clustersConsidered.append(int(result_pdf.loc[result_pdf["imdb_title_id"]==it]["prediction"]))
        else:
            clustersConsidered=list(set(result_pdf['prediction']))
        recommendationCnt=0
        while recommendationCnt<5:
            for i in clustersConsidered:
                if recommendationCnt<5:
                    for x in result_pdf.loc[result_pdf["prediction"]==i].sort_values(by=['avg_vote'], ascending=False).iterrows():
                        if recommendationCnt<5:
                            recom=x[1]["imdb_title_id"]
                            if recom not in recommendations and recom not in similarMovies:
                                recommendations.append(recom)
                                recommendationCnt+=1
                                break
                        else:
                            break
        columns=["imdb_title_id","prediction"]
        for it in result_pdf.columns:
            if it not in columns:
                result_pdf=result_pdf.drop(it,axis=1)
        print("Updating Predictions to MLDB Archive.....")
        jsonClusteredData=result_pdf.to_json()
        dict_record={}
        dict_record["TimeStamp"]=datetime.datetime.now()
        dict_record["FilterInfo"]=dictFilter
        dict_record["ClusteredData"]=jsonClusteredData
        dict_record["NumClusters"]=int(numClusters)
        dict1={}
        for it in list(scored_features_tfidf.keys())[:50]:
            dict1[it]=scored_features_tfidf[it][1]
        dict_record["Features"]=dict1
        dict_record["Recommendations"]=recommendations
        dict_record["lenData"]=int(len(result_pdf))
        
        dict_record["similarMovies"]=str1
        updateMLDB(dict_record)
        return recommendations    
@app.route('/runML/',methods=['GET','POST'])
@cross_origin(supports_credentials=True)
def runML():
    req_json = request.get_json()
    print(req_json)
    dictFilter=req_json["filter"]
    similarMovies=req_json["similarMovies"]
    recoms=ML_API(dictFilter,similarMovies)
    recoms=["https://s3bucket1abhinaav.s3.us-west-1.amazonaws.com/IMDB_Posters/imdb_"+i+".png" for i in recoms]
    return jsonify(recoms)


@app.route('/get_filtered_values/',methods=['GET','POST'])
@cross_origin(supports_credentials=True)
def get_filtered_values():
    req_json = request.get_json()
    print(req_json)
    df=getData(req_json)
    return_val = {}
    genres=set([])
    if req_json['genre'] is None:
        # encoding = 'utf-8'
        # f=open("GenreList.txt",'rb')
        # genre_list=[i.strip().decode(encoding) for i in f.readlines()]
        # f.close()
        # cnt=collections.Counter()
        # for word in genre_list:
        #     cnt[word] += 1
        # genre_list=[i[0] for i in cnt.most_common(500)]
        genre_list = df.genre.str.split(', ').tolist()
        genre_list  = list(itertools.chain(*genre_list))
        genre_list  = list(set(genre_list))
        
        return_val["genres"] = genre_list
    else:
        return_val["genres"] = [req_json['genre']]

    if req_json['actor'] is None and req_json['coactor'] is None:
        # encoding = 'utf-8'
        # f=open("ActorList.txt",'rb')
        # actor_list=[i.strip().decode(encoding) for i in f.readlines()]
        # f.close()
        actor_list = df.actors.str.split(', ').tolist()
        actor_list = list(itertools.chain(*actor_list))
        cnt=collections.Counter()
        for word in actor_list:
             cnt[word] += 1
        actor_list=[i[0] for i in cnt.most_common(500000)]

        return_val["actors"] = actor_list
        return_val["coactors"] = None
    elif req_json['actor'] is not None and req_json['coactor'] is None:
        return_val["actors"] = [req_json['actor']]
        actor_list = df.actors.str.split(', ').tolist()
        actor_list = list(itertools.chain(*actor_list))
        cnt=collections.Counter()
        for word in actor_list:
             cnt[word] += 1
        actor_list=[i[0] for i in cnt.most_common(500000)]
        actor_list.remove(req_json['actor'])
        return_val["coactors"] = actor_list
    elif req_json['actor'] is not None and req_json['coactor'] is not None:
        return_val["actors"] = [req_json['actor']]
        return_val["coactors"] = [req_json['coactor']]
    
    if req_json["language"] is None:
        language_list = df.language.str.split(', ').tolist()
        language_list = list(itertools.chain(*language_list))
        language_list = list(set(language_list))
        return_val["languages"] = language_list
    else:
        return_val["languages"] = [req_json['language']]
    
    if req_json['rating'] is None:
        rating_bins = ["<5","5-7","7-9","9+"]
        (n, bins, patches) = plt.hist(df.avg_vote,bins=[0,5,7,9,10])
        rating_list = []
        for i in range(len(n)):
            if n[i]!=0:
                rating_list.append(rating_bins[i])
        return_val["ratings"] = rating_list
    else:
        return_val["ratings"] = [req_json['rating']]
    
    if req_json['duration'] is None:
        duration_bins = ["<50 mins","50-100 mins","100-150 mins","150-200 mins",">200 mins"]
        (n, bins, patches) = plt.hist(df.duration,bins=[0,50,100,150,200,500])
        duration_list = []
        for i in range(len(n)):
            if n[i]!=0:
                duration_list.append(duration_bins[i])
        return_val["durations"] = duration_list
    else:
        return_val["durations"] = [req_json['duration']]
        
    return_val["movieCnt"]=len(df)
    return jsonify(return_val)

@app.route('/getFilmIDS/',methods=['GET','POST'])
@cross_origin(supports_credentials=True)
def getFilmIDS():
    req_json = request.get_json()
    df=getData(req_json)
    LS=list(df['imdb_title_id'])
    return jsonify(LS)

@app.route('/genre_graph/',methods=['GET','POST'])
@cross_origin(supports_credentials=True)
def genre_graph():

    #client = MongoClient("mongodb+srv://mukund:mukund@cluster0.nklch.mongodb.net/movie_recommendation?retryWrites=true&w=majority", ssl_cert_reqs=ssl.CERT_NONE)
    db = client['movie_recommendation']
    collection = db['Movie']
    df = pd.DataFrame(list(collection.find({},{"genre":1,"_id":0})))
    df = df.dropna()
    encoding = 'utf-8'
    f=open("GenreList.txt",'rb')
    genre_list=[i.strip().decode(encoding) for i in f.readlines()]
    f.close()
    cnt=collections.Counter()
    for word in genre_list:
        cnt[word] += 1
    genre_list=[i[0] for i in cnt.most_common(500)]
    total_count = sum(cnt.values())
    return_val = []
    for i in genre_list:
        temp = {}
        temp['name'] = i
        temp['y'] = cnt[i]/total_count
        return_val.append(temp)
    return jsonify({"data":return_val})

@app.route('/actor_graph/',methods=['GET','POST'])
@cross_origin(supports_credentials=True)
def actor_graph():
    req_json = request.get_json()
    db = client['movie_recommendation']
    collection = db['Movie']

    filter_dict = {}
    if req_json['genre'] is not None:
        genre = req_json['genre']
        filter_dict["genre"] = { "$regex" : genre }
    
    df = pd.DataFrame(list(collection.find(filter_dict,{"actors":1,"_id":0})))
    df = df.dropna()

    actor_list = df.actors.str.split(', ').tolist()
    actor_list = list(itertools.chain(*actor_list))
    actors, counts = np.unique(actor_list, return_counts=True)
    actors, counts = actors.tolist(), counts.tolist()
    counts, actors = (list(t) for t in zip(*sorted(zip(counts, actors), reverse=True)))
    
    return_val = []
    for i in range(len(actors)):
        temp = [actors[i],counts[i]]
        return_val.append(temp)

    return jsonify({"data":return_val[:20]})

@app.route('/ratings_graph/',methods=['GET','POST'])
@cross_origin(supports_credentials=True)
def ratings_graph():
    req_json = request.get_json()

    #client = MongoClient("mongodb+srv://mukund:mukund@cluster0.nklch.mongodb.net/movie_recommendation?retryWrites=true&w=majority", ssl_cert_reqs=ssl.CERT_NONE)
    db = client['movie_recommendation']
    collection = db['Movie']

    filter_dict = {}
    if req_json['genre'] is not None:
        genre = req_json['genre']
        filter_dict["genre"] = { "$regex" : genre }
    if req_json['actor'] is not None:
        actor = req_json['actor']
        filter_dict["actors"] = { "$regex" : actor }
    
    df = pd.DataFrame(list(collection.find(filter_dict,{"avg_vote":1,"_id":0})))
    df = df.dropna()

    rating_bins = ["<5","5-7","7-9","9+"]
    (n, bins, patches) = plt.hist(df.avg_vote,bins=[0,5,7,9,10])
    rating_list = []
    for i in range(len(n)):
        if n[i]!=0:
            rating_list.append([rating_bins[i],n[i]])
    return jsonify({"data":rating_list})

@app.route('/duration_graph/',methods=['GET','POST'])
@cross_origin(supports_credentials=True)
def duration_graph():
    req_json = request.get_json()
    db = client['movie_recommendation']
    collection = db['Movie']

    filter_dict = {}
    if req_json['genre'] is not None:
        genre = req_json['genre']
        filter_dict["genre"] = { "$regex" : genre }
    if req_json['actor'] is not None:
        actor = req_json['actor']
        filter_dict["actors"] = { "$regex" : actor }
    if req_json['rating'] is not None:
        rating = req_json['rating']
        rating_dict = {"9+":[9,10],"7-9":[7,9],"5-7":[5,7],"<5":[0,5]}
        filter_dict["avg_vote"] = {"$gte":rating_dict[rating][0],"$lt":rating_dict[rating][1]}
    
    df = pd.DataFrame(list(collection.find(filter_dict,{"duration":1,"_id":0})))
    df = df.dropna()

    return jsonify({"data":list(df.duration)})
@app.route('/import_additional_data/',methods=['GET','POST'])
@cross_origin(supports_credentials=True)
def import_additional_data():
    req_json = request.get_json()
    print("Import",req_json)

    
    db = client['movie_recommendation']
    collection = db['Movie_Test']

    df = pd.DataFrame(list(collection.find({"dataset_id":int(req_json['dataset_id'])},{"stream_id":1,"_id":0})))
    df = df.dropna()

    new_stream_id = int(df.stream_id.max() + 1)
    print(new_stream_id)

    new_df = pd.read_csv(FILE_PATH+req_json['csv_path'])
    del new_df["Unnamed: 0"]
    l=[]
    for i in range(len(new_df)):
        d={"dataset_id":int(req_json['dataset_id']),"stream_id":new_stream_id}   
        for j in new_df.columns:
            if j=="duration" or j=="votes" or j=="year":
                d[j]=int(new_df.loc[i,j])
            else:
                d[j]=new_df.loc[i,j]
        l.append(d)
    collection.insert_many(l)

    return jsonify({"dataset_id":req_json['dataset_id'], "stream_id":int(new_stream_id)})

@app.route('/import_new_data/',methods=['GET','POST'])
@cross_origin(supports_credentials=True)
def import_new_data():
    req_json = request.get_json()

    db = client['movie_recommendation']
    collection = db['Movie_Test']

    df = pd.DataFrame(list(collection.find({},{"dataset_id":1,"_id":0})))
    df = df.dropna()

    new_dataset_id = 1
    if len(df)!=0:
        new_dataset_id = int(df.dataset_id.max() + 1)

    print("Dataset id:",new_dataset_id)

    new_df = pd.read_csv(FILE_PATH+req_json['csv_path'])
    del new_df["Unnamed: 0"]
    l=[]
    for i in range(len(new_df)):
        d={"dataset_id":new_dataset_id ,"stream_id":1}   
        for j in new_df.columns:
            if j=="duration" or j=="votes" or j=="year":
                d[j]=int(new_df.loc[i,j])
            else:
                d[j]=new_df.loc[i,j]
        l.append(d)
    collection.insert_many(l)

    return jsonify({"dataset_id":int(new_dataset_id), "stream_id":1})

@app.route('/list_datasets/',methods=['GET','POST'])
@cross_origin(supports_credentials=True)
def list_datasets():
    return_val = []

    db = client['movie_recommendation']
    collection = db['Movie_Test']
    
    result = list(collection.aggregate([
        { "$group": {
            "_id": {"dataset_id": "$dataset_id"},
            "count": { "$sum": 1 }
        }}
    ]))

    for i in result:
        return_val.append([i["_id"]["dataset_id"],i['count']])
    return jsonify({"data":return_val})

@app.route('/view_dataset/<dataset_id>',methods=['GET','POST'])
@cross_origin(supports_credentials=True)
def view_dataset(dataset_id):

    db = client['movie_recommendation']
    collection = db['Movie_Test']

    print("before connection")

    content = list(collection.find({"dataset_id":int(dataset_id)},{"dataset_id":0,"stream_id":0,"_id":0}))
    filter_cols = ["imdb_title_id", "title", "year","genre","duration","country","language","actors","avg_vote","description"]
    print("after connection")
    return_val = []
    for idx in range(len(content)):
        # print(idx)
        temp = []
        for col in filter_cols:
            temp.append(re.sub(r'\W+,', '',str(content[idx][col])))
        return_val.append(temp)

    return {"data":return_val}

@app.route('/view_mldb_data/',methods=['GET','POST'])
@cross_origin(supports_credentials=True)
def view_mldb_data():

    db = client['movie_recommendation']
    collection = db['MLDB']

    print("before connection")

    content = list(collection.find({},{"_id":0}))
    df=pd.DataFrame(content)
    print("after connection")
    return_val = []
    for idx in range(len(content)):
        # print(idx)
        temp = []
        for col in df.columns:
            temp.append(re.sub(r'\W+,', '',str(content[idx][col])))
        return_val.append(temp)

    return {"data":return_val}

@app.route('/stream_producer/',methods=['GET','POST'])
@cross_origin(supports_credentials=True)
def stream_producer():
    df = pd.read_csv(FILE_PATH+"dataset_stream.csv")
    del df["Unnamed: 0"]
    producer = KafkaProducer(bootstrap_servers=['localhost:9092'],
                         value_serializer=lambda x: 
                         dumps(x).encode('utf-8'))
    for e in range(10):
        data = df.iloc[e].to_json()
        producer.send('numtest', value=data)
        sleep(0.1)
    return "Success"

@app.route('/stream_consumer/<dataset_id>',methods=['GET','POST'])
@cross_origin(supports_credentials=True)
def stream_consumer(dataset_id):

    print("Dataset Id",dataset_id)

    
    db = client['movie_recommendation']
    collection = db['Movie_Test']

    consumer = KafkaConsumer(
    'numtest',
     bootstrap_servers=['localhost:9092'],
     auto_offset_reset='earliest',
     enable_auto_commit=True,
     group_id='my-group',
     value_deserializer=lambda x: loads(x.decode('utf-8')))

    idx = 0
    for message in consumer:
        message = loads(message.value)
        message["dataset_id"] = int(dataset_id)
        collection.insert_one(message)
        print(message)
        idx+=1

        if idx == 10:
            break


    return "Success"

@app.route('/get_features/',methods=['GET','POST'])
@cross_origin(supports_credentials=True)
def get_features():
    db = client['movie_recommendation']
    collection = db['MLDB']

    req_json = request.get_json()
    content = pd.DataFrame(list(collection.find({},{"_id":0})))
    features = None
    for i in range(len(content)):
        recommendation = content.iloc[i]["Recommendations"]
        if recommendation == req_json["data"]:
            features = content.iloc[i]["Features"]

    return features

@app.route('/view_dataset_page/<dataset_id>',methods=['GET','POST'])
@cross_origin(supports_credentials=True)
def view_dataset_page(dataset_id):
    return render_template('index.html', dataset_id=dataset_id)
# @app.route('/WebPages')
def WebPages():
    return render_template('../WebPages/cover/index.html')
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("--port")
    args=parser.parse_args()
    app.run(debug=False,port=int(args.port))





