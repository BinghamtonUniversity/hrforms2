import React,{useRef} from "react";
import {useQueryClient} from "react-query";
import {Row,Col,Button,Form} from "react-bootstrap";
import {useToasts} from "react-toast-notifications";
import JoditEditor from "jodit-react";
import {editorConfig} from "../../config";
import {useForm,Controller} from "react-hook-form";
import {useAppQueries} from "../../queries";

export default function AdminNews() {
    const {addToast,removeToast} = useToasts();
    const queryclient = useQueryClient();
    const {getNews,patchNews} = useAppQueries();
    const news = getNews();
    const updateNews = patchNews();
    const config = editorConfig();
    const editor = useRef();
    const {handleSubmit,control} = useForm();
    const onSubmit = data => {
        addToast(<><h5>Saving</h5><p>Updating News...</p></>,{appearance:'info',autoDismiss:false},id=>{
            updateNews.mutateAsync({NEWS_TEXT:data.newsText}).then(()=>{
                removeToast(id);
                addToast(<><h5>Success!</h5><p>New updated.</p></>,{appearance:'success',autoDismiss:true},()=>{
                    queryclient.refetchQueries('news');
                });
            }).catch(e=>{
                removeToast(id);
                addToast(<><h5>Error!</h5><p>Failed to update news. {e?.message}.</p></>,{appearance:'error',autoDismissTimeout:20000});
            });
        });
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
                    <Form.Group controlId="newsText">
                        <Controller name="newsText" control={control} render={({field:{onBlur,onChange,value}}) => (
                            <JoditEditor ref={editor} config={config} onBlur={onBlur} value={news.data?.NEWS_TEXT} onChange={onChange}/>
                        )}/>
                    </Form.Group>
                    <Button variant="primary" type="submit">Update</Button>
                </Form>
            </article>
        </section>
    );
}
