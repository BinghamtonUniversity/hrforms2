import React,{ useRef } from "react";
import { useQueryClient } from "react-query";
import { Row, Col, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import JoditEditor from "jodit-react";
import { editorConfig } from "../../config/app";
import { useForm, Controller } from "react-hook-form";
import { AppButton, errorToast } from "../../blocks/components";
import { t } from "../../config/text";
import useNewsQueries from "../../queries/news";
import { Helmet } from "react-helmet";

export default function AdminNews() {
    const config = editorConfig();

    const editor = useRef();

    const queryclient = useQueryClient();
    const { getNews, patchNews } = useNewsQueries();
    const news = getNews();
    const updateNews = patchNews();

    const { handleSubmit, control } = useForm();

    const onSubmit = data => {
        toast.promise(new Promise((resolve,reject) => {
            updateNews.mutateAsync({NEWS_TEXT:data.newsText}).then(()=>{
                queryclient.refetchQueries('news').then(()=>resolve()).catch(err=>reject(err));
            }).catch(err=>reject(err));
        }),{
            pending:t('admin.news.actions.update.pending'),
            success:t('admin.news.actions.update.success'),
            error:errorToast(t('admin.news.actions.update.error'))
        });
    }
    return (
        <section>
            <header>
                <Helmet>
                    <title>{t('admin.news.title')}</title>
                </Helmet>
                <Row>
                    <Col>
                        <h2>{t('admin.news.title')}</h2>
                    </Col>
                </Row>
            </header>
            <article>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Form.Group as={Row} controlId="newsText">
                        <Col xs="auto">
                            <Controller name="newsText" control={control} render={({field}) => (
                                <JoditEditor ref={editor} config={config} onBlur={d=>field.onBlur(d)} value={news.data?.NEWS_TEXT} onChange={d=>field.onChange(d)}/>
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
