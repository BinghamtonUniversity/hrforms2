import React,{useState,useEffect} from "react";
import {useAppQueries} from "../queries";
import { useCookies } from "react-cookie";
import {Alert} from "react-bootstrap";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import htmr from "htmr";

export function News() {
    const {getNews} = useAppQueries();
    const news = getNews();
    const [cookies, setCookie] = useCookies();
    const [show,setShow] = useState(true);
    const dismissNews = () => {
        // store cookie for when news was dismissed
        setCookie('hrforms2_news',Date.now(),{path:'/'}); //TODO: move to a JSON cookie
        setShow(false);
    }
    // add useEffect to check for cookie and see if news has been updated since last dismiss
    useEffect(() => {
        if (!news.data) return;
        //check cookie; if news has been updated since cookie date or diff within set time frame
        const dism = cookies['hrforms2_news'] || Date.now();
        const diff = Date.now() - dism;
        console.log(diff);
        // if dism < modifiedDateUnix: show
        // if diff == 0: show
        // if diff > 60000: show
        if (dism < news.data['modifiedDateUnix'] || diff == 0 || diff > 60000) {
            setShow(true);
        } else {
            setShow(false);
        }
        
    },[news.data]);
    if (show && news.data) {
        return (
            <Alert variant="light" onClose={dismissNews} dismissible>
                <Alert.Heading>News & Notices</Alert.Heading>
                {htmr(news.data.NEWS_TEXT)}
            </Alert>        
        );
    }
    return null;
}

/*export function News() {
    const [collapsed,setCollapsed] = useState(true);
    const {getNews} = useAppQueries();
    const news = getNews();
    if (news.isLoading||news.isError) return <p>Loading...</p>;
    return (
        <Alert variant="success">
            <Alert.Heading className="d-flex justify-content-between" style={{marginBottom:(collapsed)?0:null}}>
                News
                <span id="news-collapse-toggle" className={(collapsed)?'closed':''} onClick={()=>setCollapsed(!collapsed)}><FontAwesomeIcon icon="chevron-down"/></span>
            </Alert.Heading>
            {news.data && 
            <dl id="news-list" style={{display:(collapsed)?'none':'block'}}>
                {news.data.map(n=><div key={n.NEWS_ID}><dt>{n.NEWS_TITLE}</dt><dd dangerouslySetInnerHTML={{__html:n.NEWS_TEXT}}></dd></div>)}
            </dl>
            }
        </Alert>
    );
}*/