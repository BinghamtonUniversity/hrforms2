import q from '../queries';
import {useQuery,useMutation} from "react-query";
import { format, parse } from "date-fns";

export default function useNewsQueries() {
    const getNews = (...args) => {
        const options = args[0]?.options||args[0]||{};
        if(options.select) options.select2 = options.select;
        options.select = data => {
            if (!data) return;
            const md = parse(data.MODIFIED_DATE,'dd-MMM-yy H:mm:ss',new Date());
            data.modifiedDateUnix = (md!='Invalid Date')?format(md,'t'):null;
            return (options.select2) ? options.select2(data) : data;
        }
        return useQuery('news',q('news'),options);
    }
    const patchNews = () => useMutation(q('news','PATCH',{}));
    /*const putNews = (...args) => {
        const newsid = args[0]?.NEWS_ID||args[0];
        if (!newsid) return stub;
        return useMutation(d=>{
            return q(`news/${newsid}`,'PUT',d)();
        });
    }*/

    return {getNews,patchNews};
}