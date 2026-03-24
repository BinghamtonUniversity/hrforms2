import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Redirect, useParams } from "react-router-dom";
import { RequestContext, defaultVals } from "../../config/request";
import { merge, get } from "lodash";
import useRequestQueries from "../../queries/requests";
import Review from "../../blocks/request/review";
import { Loading } from "../../blocks/components";

export default function RequestArchiveView({reqId,setShouldBlock}) {
    const { id } = useParams();

    const [redirect,setRedirect] = useState('');

    const { getArchiveRequest } = useRequestQueries(id||reqId);
    const request = getArchiveRequest({
        onSuccess:data=>{
            console.debug('Request Data Fetched:\n',data);
            if (get(data,'redirect',false)) {
                console.warn(`Invalid path, redirecting to ${data.newpath}`);
                setRedirect(data.newpath);
            }
        },
        onError:e=>{
            console.error(e);
        }
    });

    if (redirect) return <Redirect to={redirect}/>;
    if (request.isError) return <Loading type="alert" isError>Failed To Load Request Data - <small>{request.error?.name} - {request.error?.description||request.error?.message}</small></Loading>;
    if (!request.data) return <Loading type="alert">Loading Request Data</Loading>;
    return (
        <section>
            {request.data && <RequestViewData data={request.data} setShouldBlock={setShouldBlock}/>}
        </section>
    );
}

function RequestViewData({data,setShouldBlock}) {
    const methods = useForm({defaultValues: merge({},defaultVals,data)});
    return (
        <FormProvider {...methods}>
            <RequestContext.Provider value={{
                reqId:data.reqId,
                isDraft:false,
                canEdit:false,
                createdBy:data.createdBy,
                journalStatus:'Z'
            }}>
                <Review setShouldBlock={setShouldBlock}/>
            </RequestContext.Provider>
        </FormProvider>
    );
}