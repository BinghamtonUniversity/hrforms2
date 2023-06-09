import React,{useRef} from "react";
import { useQueryClient } from "react-query";
import { Row, Col, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import JoditEditor from "jodit-react";
import { editorConfig } from "../../config";
import { useForm, Controller } from "react-hook-form";
import { useAppQueries } from "../../queries";
import { AppButton, errorToast } from "../../blocks/components";

export default function AdminNews() {
    const queryclient = useQueryClient();
    const {getNews,patchNews} = useAppQueries();
    const news = getNews();
    const updateNews = patchNews();
    const config = editorConfig();
    const editor = useRef();
    const {handleSubmit,control} = useForm();
    const onSubmit = data => {
        toast.promise(new Promise((resolve,reject) => {
            updateNews.mutateAsync({NEWS_TEXT:data.newsText}).then(()=>{
                queryclient.refetchQueries('news').then(()=>resolve()).catch(err=>reject(err));
            }).catch(err=>reject(err));
        }),{
            pending:'Updating news...',
            success:'News updated successfully',
            error:errorToast('Failed to update news')
        })
    }
    return (
        <section>
            <header>
                <Row>
                    <Col><h2>Admin News</h2></Col>
                </Row>
            </header>
            <article>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Form.Group as={Row} controlId="newsText">
                        <Col xs="auto">
                            <Controller name="newsText" control={control} render={({field:{onBlur,onChange}}) => (
                                <JoditEditor ref={editor} config={config} onBlur={onBlur} value={news.data?.NEWS_TEXT} onChange={onChange}/>
                            )}/>
                        </Col>
                    </Form.Group>
                    <Row>
                        <Col xs="auto" className="button-group">
                            <AppButton format="save" type="submit">Update</AppButton>
                        </Col>
                    </Row>
                </Form>
            </article>
        </section>
    );
}
