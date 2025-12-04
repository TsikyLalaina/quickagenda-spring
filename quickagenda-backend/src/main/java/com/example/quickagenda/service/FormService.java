package com.example.quickagenda.service;

import com.example.quickagenda.dto.*;
import com.example.quickagenda.entity.Event;
import com.example.quickagenda.entity.Form;
import com.example.quickagenda.entity.FormField;
import com.example.quickagenda.entity.FormResponse;
import com.example.quickagenda.repository.EventRepository;
import com.example.quickagenda.repository.FormFieldRepository;
import com.example.quickagenda.repository.FormRepository;
import com.example.quickagenda.repository.FormResponseRepository;
import com.example.quickagenda.dto.FormResponseDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FormService {
    private final EventRepository eventRepository;
    private final FormRepository formRepository;
    private final FormFieldRepository fieldRepository;
    private final FormResponseRepository responseRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public FormService(EventRepository eventRepository,
                       FormRepository formRepository,
                       FormFieldRepository fieldRepository,
                       FormResponseRepository responseRepository) {
        this.eventRepository = eventRepository;
        this.formRepository = formRepository;
        this.fieldRepository = fieldRepository;
        this.responseRepository = responseRepository;
    }

    private Event getEventOr404(String code) {
        return eventRepository.findByShareCode(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private static FormConfigResponse toConfig(Form form, List<FormField> fields) {
        List<FormFieldDto> fds = fields.stream().map(f -> {
            FormFieldDto d = new FormFieldDto();
            d.setId(f.getId());
            d.setType(f.getType());
            d.setLabel(f.getLabel());
            d.setRequired(f.isRequired());
            d.setOrderIndex(f.getOrderIndex());
            d.setOptionsJson(f.getOptionsJson());
            d.setConfigJson(f.getConfigJson());
            return d;
        }).collect(Collectors.toList());
        return new FormConfigResponse(form.getId(), form.getTitle(), form.isActive(), form.getOpenAt(), form.getCloseAt(), fds);
    }

    @Transactional(readOnly = true)
    public FormConfigResponse getAdminForm(String code) {
        Event event = getEventOr404(code);
        Form form = formRepository.findByEvent(event).orElse(null);
        if (form == null) return new FormConfigResponse(null, null, false, null, null, List.of());
        List<FormField> fields = fieldRepository.findByFormOrderByOrderIndexAsc(form);
        return toConfig(form, fields);
    }

    @Transactional
    public void upsertForm(String code, FormUpsertRequest req) {
        Event event = getEventOr404(code);
        Form form = formRepository.findByEvent(event).orElse(null);
        if (form == null) {
            form = new Form();
            form.setEvent(event);
        }
        form.setTitle(req.getTitle());
        form.setActive(req.isActive());
        form.setOpenAt(req.getOpenAt());
        form.setCloseAt(req.getCloseAt());
        Form saved;
        try {
            saved = formRepository.save(form);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A form already exists for this event");
        }
        // Replace fields
        fieldRepository.deleteByForm(saved);
        int idx = 0;
        for (FormFieldDto d : req.getFields()) {
            FormField f = new FormField();
            f.setForm(saved);
            f.setType(d.getType());
            f.setLabel(d.getLabel());
            f.setRequired(d.isRequired());
            f.setOrderIndex(d.getOrderIndex() != 0 ? d.getOrderIndex() : idx++);
            f.setOptionsJson(d.getOptionsJson());
            f.setConfigJson(d.getConfigJson());
            fieldRepository.save(f);
        }
    }

    @Transactional(readOnly = true)
    public FormConfigResponse getPublicForm(String code, String email) {
        Event event = getEventOr404(code);
        Form form = formRepository.findByEvent(event).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!form.isActive()) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        OffsetDateTime now = OffsetDateTime.now();
        if (form.getOpenAt() != null && now.isBefore(form.getOpenAt())) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        if (form.getCloseAt() != null && now.isAfter(form.getCloseAt())) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        List<FormField> fields = fieldRepository.findByFormOrderByOrderIndexAsc(form);
        return toConfig(form, fields);
    }

    @Transactional
    public void submit(String code, FormSubmitRequest body) {
        if (body == null || body.getEmail() == null || body.getEmail().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email required");
        }
        Event event = getEventOr404(code);
        // Invited-only gating removed: any email can submit.
        Form form = formRepository.findByEvent(event).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!form.isActive()) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        OffsetDateTime now = OffsetDateTime.now();
        if (form.getOpenAt() != null && now.isBefore(form.getOpenAt())) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        if (form.getCloseAt() != null && now.isAfter(form.getCloseAt())) throw new ResponseStatusException(HttpStatus.FORBIDDEN);

        Map<String, Object> answers = body.getAnswers();
        String json;
        try {
            json = objectMapper.writeValueAsString(answers == null ? Map.of() : answers);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid answers");
        }

        FormResponse resp = responseRepository.findByFormAndEmail(form, body.getEmail()).orElse(null);
        if (resp == null) {
            resp = new FormResponse();
            resp.setForm(form);
            resp.setEmail(body.getEmail());
            resp.setCreatedAt(now);
        }
        resp.setAnswersJson(json);
        resp.setUpdatedAt(now);
        responseRepository.save(resp);
    }

    @Transactional(readOnly = true)
    public List<FormResponseDto> listResponses(String code) {
        Event event = getEventOr404(code);
        Form form = formRepository.findByEvent(event).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        List<FormResponse> list = responseRepository.findByFormOrderByCreatedAtDesc(form);
        return list.stream().map(r -> {
            Map<String, Object> ans;
            try {
                ans = objectMapper.readValue(r.getAnswersJson() == null ? "{}" : r.getAnswersJson(), Map.class);
            } catch (Exception e) {
                ans = Map.of();
            }
            return new FormResponseDto(r.getEmail(), r.getCreatedAt(), ans);
        }).collect(Collectors.toList());
    }
}
