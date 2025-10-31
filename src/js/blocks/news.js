import React,{useState,useEffect} from "react";
import { useCookies } from "react-cookie";
import {Alert} from "react-bootstrap";
import htmr from "htmr";
import { useSettingsContext } from "../app";
import { t } from "../config/text";
import useNewsQueries from "../queries/news";
import { Icon } from "@iconify/react/dist/iconify.js";
import { format } from "date-fns";

export function News() {
    const { general } = useSettingsContext();
    const { getNews } = useNewsQueries();
    const news = getNews();
    const [cookies, setCookie] = useCookies();
    const [show,setShow] = useState(true);
    const dismissNews = () => {
        // store cookie for when news was dismissed
        setCookie('hrforms2_news',Date.now(),{path:'/'});
        setShow(false);
    }
    // add useEffect to check for cookie and see if news has been updated since last dismiss
    useEffect(() => {
        if (!news.data) return;
        //check cookie; if news has been updated since cookie date or diff within set time frame
        const dism = cookies['hrforms2_news'] || Date.now();
        const diff = Date.now() - dism;
        // 1000 = 1 sec, 60000 = 1 minute, 360000 = 1 hour
        // if dism < modifiedDateUnix: show
        // if diff == 0: show
        // if diff > general.hideNewsExpire * 1 hour: show
        if (dism < news.data['modifiedDateUnix'] || diff == 0 || diff > (parseInt(general.hideNewsExpire,10)*60000)) {
            setShow(true);
        } else {
            setShow(false);
        }
        
    },[news.data]);
    if (show && news.data) {
        if (!news.data.NEWS_TEXT) return null;
        return (
            <Alert variant="light" onClose={dismissNews} dismissible={general.hideNews==="Y"}>
                <Alert.Heading> <Icon icon="mdi:newspaper" className="iconify-inline"/>{t('home.news.heading')}</Alert.Heading>
                {htmr(news.data.NEWS_TEXT)}
                {general.showUpdateDate === 'Y' &&
                    <p className="mb-0 font-italic d-flex justify-content-end"><small>-- Updated: {format(news.data.MODIFIED_DATE,general.updateDateFormat)}</small></p>
                }
            </Alert>        
        );
    }
    return null;
}
