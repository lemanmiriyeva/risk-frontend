"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Radio from '@mui/material/Radio';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {useSnackbar} from "notistack";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";
import {C, dialogPaperSx, fieldSx, primaryButtonSx, softButtonSx} from "./trainingsShared";

let keySeq = 0;
const nextKey = () => `k${++keySeq}`;

const emptyOption = () => ({key: nextKey(), text: '', is_correct: false});
const emptyQuestion = () => ({
    key: nextKey(), text: '',
    options: [{...emptyOption(), is_correct: true}, emptyOption()],
});

function fromServer(questions) {
    return (questions || []).map((q) => ({
        key: nextKey(),
        text: q.text,
        options: q.options.map((o) => ({key: nextKey(), text: o.text, is_correct: !!o.is_correct})),
    }));
}

/**
 * Təlimin quiz-ini tərtib edən dialoq (yalnız "Təlim materialları" admini).
 * Hər sualın tək düzgün cavabı olur. Yadda saxlananda quiz tam əvəz olunur -
 * əvvəlki nəticələr statistikada olduğu kimi qalır.
 */
export default function QuizEditorDialog({open, onClose, training, onSaved}) {
    const {enqueueSnackbar} = useSnackbar();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open || !training?.id) return;
        let alive = true;
        setLoading(true);
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.TRAININGS.QUIZ(training.id) + '?manage=1');
                if (alive) setQuestions(fromServer(res.data?.questions));
            } catch (err) {
                enqueueSnackbar(handleError(err), {variant: 'error'});
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, training?.id]);

    function updateQuestion(qKey, patch) {
        setQuestions((qs) => qs.map((q) => (q.key === qKey ? {...q, ...patch} : q)));
    }

    function updateOption(qKey, oKey, patch) {
        setQuestions((qs) => qs.map((q) => {
            if (q.key !== qKey) return q;
            return {...q, options: q.options.map((o) => (o.key === oKey ? {...o, ...patch} : o))};
        }));
    }

    function markCorrect(qKey, oKey) {
        setQuestions((qs) => qs.map((q) => {
            if (q.key !== qKey) return q;
            return {...q, options: q.options.map((o) => ({...o, is_correct: o.key === oKey}))};
        }));
    }

    function removeOption(qKey, oKey) {
        setQuestions((qs) => qs.map((q) => {
            if (q.key !== qKey) return q;
            const options = q.options.filter((o) => o.key !== oKey);
            if (options.length && !options.some((o) => o.is_correct)) options[0] = {...options[0], is_correct: true};
            return {...q, options};
        }));
    }

    async function save() {
        const payload = questions.map((q) => ({
            text: q.text.trim(),
            options: q.options.filter((o) => o.text.trim()).map((o) => ({text: o.text.trim(), is_correct: o.is_correct})),
        }));
        for (let i = 0; i < payload.length; i++) {
            const q = payload[i];
            if (!q.text) return enqueueSnackbar(`${i + 1}-ci sualın mətni boşdur.`, {variant: 'warning'});
            if (q.options.length < 2) return enqueueSnackbar(`${i + 1}-ci sualın ən azı 2 cavabı olmalıdır.`, {variant: 'warning'});
            if (q.options.filter((o) => o.is_correct).length !== 1) {
                return enqueueSnackbar(`${i + 1}-ci sualda düzgün cavabı seçin (boş olmayan variantlardan).`, {variant: 'warning'});
            }
        }
        setSaving(true);
        try {
            await service_api.put(NEXT_API_ENDPOINTS.TRAININGS.QUIZ(training.id), {questions: payload});
            enqueueSnackbar(payload.length ? 'Quiz yadda saxlanıldı.' : 'Quiz silindi.', {variant: 'success'});
            onSaved?.();
            onClose();
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth PaperProps={{sx: dialogPaperSx}}>
            <Box sx={{
                px: 3, pt: 3, pb: 2, display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', borderBottom: `1px solid ${C.line}`,
            }}>
                <Box>
                    <Typography sx={{fontSize: 17, fontWeight: 700, color: C.ink}}>Quiz</Typography>
                    <Typography sx={{fontSize: 12.5, color: C.inkMuted}}>{training?.title}</Typography>
                </Box>
                <IconButton size="small" onClick={onClose} disabled={saving}><CloseIcon fontSize="small"/></IconButton>
            </Box>

            <Box sx={{px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '65vh', overflowY: 'auto'}}>
                <Typography sx={{fontSize: 12.5, color: C.inkMuted}}>
                    Quiz istifadəçi videonu sona qədər izlədikdən sonra açılır. Hər sual üçün düzgün cavabı
                    dairəciklə işarələyin.
                </Typography>

                {loading ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}><CircularProgress size={24} sx={{color: C.gold}}/></Box>
                ) : questions.length === 0 ? (
                    <Typography sx={{fontSize: 13.5, color: C.inkFaint, py: 2, textAlign: 'center'}}>
                        Hələ sual yoxdur.
                    </Typography>
                ) : questions.map((q, qi) => (
                    <Box key={q.key} sx={{border: `1px solid ${C.line}`, borderRadius: '10px', p: 2}}>
                        <Box sx={{display: 'flex', gap: 1, alignItems: 'flex-start'}}>
                            <Typography sx={{fontWeight: 700, color: C.gold, mt: 1, minWidth: 22}}>{qi + 1}.</Typography>
                            <TextField size="small" fullWidth multiline label="Sual" sx={fieldSx}
                                       value={q.text} onChange={(e) => updateQuestion(q.key, {text: e.target.value})}/>
                            <Tooltip title="Sualı sil">
                                <IconButton size="small" sx={{mt: 0.5}}
                                            onClick={() => setQuestions((qs) => qs.filter((x) => x.key !== q.key))}>
                                    <DeleteOutlineIcon fontSize="small"/>
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <Box sx={{pl: 3.5, mt: 1.25, display: 'flex', flexDirection: 'column', gap: 0.75}}>
                            {q.options.map((o, oi) => (
                                <Box key={o.key} sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                                    <Tooltip title="Düzgün cavab">
                                        <Radio size="small" checked={o.is_correct} onChange={() => markCorrect(q.key, o.key)}
                                               sx={{color: C.lineStrong, '&.Mui-checked': {color: '#2E6B3F'}}}/>
                                    </Tooltip>
                                    <TextField size="small" fullWidth placeholder={`Variant ${oi + 1}`} sx={fieldSx}
                                               value={o.text} onChange={(e) => updateOption(q.key, o.key, {text: e.target.value})}/>
                                    <IconButton size="small" disabled={q.options.length <= 2}
                                                onClick={() => removeOption(q.key, o.key)}>
                                        <CloseIcon fontSize="small"/>
                                    </IconButton>
                                </Box>
                            ))}
                            <Box>
                                <Button size="small" startIcon={<AddIcon/>} sx={{textTransform: 'none', color: C.inkMuted}}
                                        onClick={() => updateQuestion(q.key, {options: [...q.options, emptyOption()]})}>
                                    Variant əlavə et
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                ))}

                {!loading && (
                    <Box>
                        <Button startIcon={<AddIcon/>} sx={softButtonSx}
                                onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])}>
                            Sual əlavə et
                        </Button>
                    </Box>
                )}
            </Box>

            <Box sx={{px: 3, pb: 3, pt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1, borderTop: `1px solid ${C.line}`}}>
                <Button onClick={onClose} disabled={saving} sx={{color: C.inkMuted, textTransform: 'none'}}>İmtina</Button>
                <Button variant="contained" onClick={save} disabled={saving || loading} sx={primaryButtonSx}>
                    {saving ? <CircularProgress size={18} sx={{color: '#fff'}}/> : 'Yadda saxla'}
                </Button>
            </Box>
        </Dialog>
    );
}
