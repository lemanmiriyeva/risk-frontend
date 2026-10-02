"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Dialog from '@mui/material/Dialog';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import {useSnackbar} from "notistack";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";
import {C, SectionHead, StatusPill, dialogPaperSx, panelSx, primaryButtonSx, softButtonSx} from "./trainingsShared";

/**
 * Video sona qədər izlənildikdən sonra açılan quiz. Cavablar yalnız istifadəçi
 * «Təsdiqlə» düyməsini basdıqdan sonra serverə göndərilir və statistikaya düşür.
 */
export default function TrainingQuiz({training, onSubmitted}) {
    const {enqueueSnackbar} = useSnackbar();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState({});
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.TRAININGS.QUIZ(training.id));
                if (alive) setQuiz(res.data);
            } catch (err) {
                enqueueSnackbar(handleError(err), {variant: 'error'});
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [training.id]);

    const questions = quiz?.questions || [];
    const answeredAll = questions.length > 0 && questions.every((q) => answers[q.id]);
    const resultByQuestion = Object.fromEntries((result?.results || []).map((r) => [r.question_id, r.is_correct]));

    async function submit() {
        setSubmitting(true);
        try {
            const res = await service_api.post(NEXT_API_ENDPOINTS.TRAININGS.QUIZ_SUBMIT(training.id), {answers});
            setResult(res.data);
            setConfirmOpen(false);
            onSubmitted?.(res.data);
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setSubmitting(false);
        }
    }

    function retry() {
        setResult(null);
        setAnswers({});
    }

    return (
        <Box sx={panelSx}>
            <SectionHead icon={<QuizOutlinedIcon sx={{fontSize: 18}}/>} title="Quiz" count={questions.length || undefined}
                         action={training.my_quiz && !result ? (
                             <StatusPill status={training.my_quiz.passed ? 'passed' : 'failed'}
                                         label={`Ən yaxşı nəticə: ${training.my_quiz.best_percent}%`}/>
                         ) : null}/>
            <Box sx={{px: 2.5, pb: 2.5}}>
                {loading ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}><CircularProgress size={22} sx={{color: C.gold}}/></Box>
                ) : result ? (
                    <Box>
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 2, p: 2, mb: 2, borderRadius: '10px',
                            backgroundColor: result.passed ? 'rgba(46,107,63,0.08)' : C.dangerTint,
                        }}>
                            {result.passed
                                ? <CheckCircleIcon sx={{fontSize: 36, color: '#2E6B3F'}}/>
                                : <CancelIcon sx={{fontSize: 36, color: C.danger}}/>}
                            <Box>
                                <Typography sx={{fontSize: 20, fontWeight: 800, color: C.ink}}>
                                    {result.percent}% · {result.correct_count}/{result.total_count} düzgün
                                </Typography>
                                <Typography sx={{fontSize: 13, color: C.inkMuted}}>
                                    {result.passed
                                        ? 'Təbriklər, quizi uğurla keçdiniz.'
                                        : `Keçid balı ${result.pass_percent}%-dir. Videonu yenidən nəzərdən keçirib təkrar cəhd edə bilərsiniz.`}
                                </Typography>
                            </Box>
                        </Box>
                        {questions.map((q, i) => (
                            <Box key={q.id} sx={{display: 'flex', gap: 1, alignItems: 'flex-start', py: 0.75}}>
                                {resultByQuestion[q.id]
                                    ? <CheckCircleIcon sx={{fontSize: 18, color: '#2E6B3F', mt: 0.25}}/>
                                    : <CancelIcon sx={{fontSize: 18, color: C.danger, mt: 0.25}}/>}
                                <Typography sx={{fontSize: 13.5, color: C.ink}}>{i + 1}. {q.text}</Typography>
                            </Box>
                        ))}
                        <Button sx={{...softButtonSx, mt: 2}} onClick={retry}>Yenidən cəhd et</Button>
                    </Box>
                ) : questions.length === 0 ? (
                    <Typography sx={{fontSize: 13.5, color: C.inkFaint}}>Bu təlim üçün quiz yoxdur.</Typography>
                ) : (
                    <Box>
                        {questions.map((q, i) => (
                            <Box key={q.id} sx={{py: 1.5, borderBottom: i < questions.length - 1 ? `1px solid ${C.line}` : 'none'}}>
                                <Typography sx={{fontSize: 14, fontWeight: 600, color: C.ink, mb: 0.5, whiteSpace: 'pre-wrap'}}>
                                    {i + 1}. {q.text}
                                </Typography>
                                <RadioGroup value={answers[q.id] ? String(answers[q.id]) : ''}
                                            onChange={(e) => setAnswers((a) => ({...a, [q.id]: Number(e.target.value)}))}>
                                    {q.options.map((o) => (
                                        <FormControlLabel key={o.id} value={String(o.id)}
                                                          control={<Radio size="small" sx={{'&.Mui-checked': {color: C.gold}}}/>}
                                                          label={<Typography sx={{fontSize: 13.5, color: C.ink}}>{o.text}</Typography>}/>
                                    ))}
                                </RadioGroup>
                            </Box>
                        ))}
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 2, mt: 2}}>
                            <Button variant="contained" sx={primaryButtonSx} disabled={!answeredAll}
                                    onClick={() => setConfirmOpen(true)}>
                                Təsdiqlə
                            </Button>
                            <Typography sx={{fontSize: 12.5, color: C.inkMuted}}>
                                {Object.keys(answers).length} / {questions.length} sual cavablandırılıb
                            </Typography>
                        </Box>
                    </Box>
                )}
            </Box>

            <Dialog open={confirmOpen} onClose={submitting ? undefined : () => setConfirmOpen(false)}
                    maxWidth="xs" fullWidth PaperProps={{sx: dialogPaperSx}}>
                <Box sx={{p: 3}}>
                    <Typography sx={{fontSize: 17, fontWeight: 700, color: C.ink, mb: 1}}>Cavabları təsdiqləyirsiniz?</Typography>
                    <Typography sx={{fontSize: 13.5, color: C.inkMuted}}>
                        Təsdiqləndikdən sonra nəticəniz statistikaya yazılacaq və bu cəhdin cavablarını dəyişmək mümkün olmayacaq.
                    </Typography>
                    <Box sx={{display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3}}>
                        <Button onClick={() => setConfirmOpen(false)} disabled={submitting}
                                sx={{color: C.inkMuted, textTransform: 'none'}}>Geri</Button>
                        <Button variant="contained" onClick={submit} disabled={submitting} sx={primaryButtonSx}>
                            {submitting ? <CircularProgress size={18} sx={{color: '#fff'}}/> : 'Təsdiqlə'}
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        </Box>
    );
}
