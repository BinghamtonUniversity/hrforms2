import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useParams } from "react-router-dom";
import { RequestContext, defaultVals } from "../../config/request";
import { merge } from "lodash";
import useRequestQueries from "../../queries/requests";
import Review from "../../blocks/request/review";

export default function RequestArchiveView({reqId}) {
    const { id } = useParams();

    const { getArchiveRequest } = useRequestQueries(id||reqId);
    const reqData = getArchiveRequest();

    return (
        <section>
            {reqData.data && <RequestViewData data={reqData.data}/>}
        </section>
    );
}

function RequestViewData({data}) {
    const methods = useForm({defaultValues: merge({},defaultVals,data)});
    return (
        <FormProvider {...methods}>
            <RequestContext.Provider value={{
                reqId:data.reqId,
                isDraft:false,
                canEdit:false,
                createdBy:data.createdBy,
                //posTypes:postypes.data, //Not needed?
                //lastJournal:data.lastJournal, //DNE
            }}>
                <Review/>
            </RequestContext.Provider>
        </FormProvider>
    );
}