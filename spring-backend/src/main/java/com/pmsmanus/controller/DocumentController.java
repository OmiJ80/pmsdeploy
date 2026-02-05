package com.pmsmanus.controller;

import com.pmsmanus.entity.Document;
import com.pmsmanus.repo.DocumentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {
    private final DocumentRepository repository;

    public DocumentController(DocumentRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/patient/{patientId}")
    public List<Document> byPatient(@PathVariable Integer patientId) {
        return repository.findByPatientIdOrderByCreatedAtDesc(patientId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Document> getById(@PathVariable Integer id) {
        Optional<Document> d = repository.findById(id);
        return d.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Document> create(@RequestBody Document document) {
        document.setCreatedAt(LocalDateTime.now());
        document.setUpdatedAt(LocalDateTime.now());
        Document saved = repository.save(document);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
