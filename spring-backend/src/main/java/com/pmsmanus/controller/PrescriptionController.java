package com.pmsmanus.controller;

import com.pmsmanus.entity.Prescription;
import com.pmsmanus.repo.PrescriptionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {
    private final PrescriptionRepository repository;

    public PrescriptionController(PrescriptionRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/patient/{patientId}")
    public List<Prescription> byPatient(@PathVariable Integer patientId) {
        return repository.findByPatientIdOrderByCreatedAtDesc(patientId);
    }

    @PostMapping
    public ResponseEntity<Prescription> create(@RequestBody Prescription p) {
        if (p.getStatus() == null) p.setStatus("active");
        if (p.getStartDate() == null) p.setStartDate(LocalDate.now());
        p.setCreatedAt(LocalDateTime.now());
        p.setUpdatedAt(LocalDateTime.now());
        Prescription saved = repository.save(p);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Prescription> update(@PathVariable Integer id, @RequestBody Prescription updates) {
        return repository.findById(id)
                .map(existing -> {
                    if (updates.getMedicationName() != null) existing.setMedicationName(updates.getMedicationName());
                    if (updates.getDosage() != null) existing.setDosage(updates.getDosage());
                    if (updates.getFrequency() != null) existing.setFrequency(updates.getFrequency());
                    if (updates.getDuration() != null) existing.setDuration(updates.getDuration());
                    if (updates.getRoute() != null) existing.setRoute(updates.getRoute());
                    if (updates.getQuantity() != null) existing.setQuantity(updates.getQuantity());
                    if (updates.getInstructions() != null) existing.setInstructions(updates.getInstructions());
                    if (updates.getStartDate() != null) existing.setStartDate(updates.getStartDate());
                    if (updates.getEndDate() != null) existing.setEndDate(updates.getEndDate());
                    if (updates.getStatus() != null) existing.setStatus(updates.getStatus());
                    existing.setUpdatedAt(LocalDateTime.now());
                    Prescription saved = repository.save(existing);
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
