package com.pmsmanus.controller;

import com.pmsmanus.entity.Patient;
import com.pmsmanus.repo.PatientRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/patients")
public class PatientController {
    private final PatientRepository patientRepository;


    public PatientController(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }
    
    
    @GetMapping
    public List<Patient> list() {
        return patientRepository.findAll();
    }

    @GetMapping("/search")
    public List<Patient> search(@RequestParam("query") String query) {
        return patientRepository.search(query);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Patient> getById(@PathVariable Integer id) {
        Optional<Patient> p = patientRepository.findById(id);
        return p.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Patient> create(@RequestBody Patient patient) {
        patient.setCreatedAt(LocalDateTime.now());
        patient.setUpdatedAt(LocalDateTime.now());
        Patient saved = patientRepository.save(patient);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Patient> update(@PathVariable Integer id, @RequestBody Patient updates) {
        Optional<Patient> existing = patientRepository.findById(id);
        if (existing.isEmpty()) return ResponseEntity.notFound().build();
        Patient p = existing.get();
        if (updates.getFirstName() != null) p.setFirstName(updates.getFirstName());
        if (updates.getLastName() != null) p.setLastName(updates.getLastName());
        if (updates.getEmail() != null) p.setEmail(updates.getEmail());
        if (updates.getPhone() != null) p.setPhone(updates.getPhone());
        if (updates.getDateOfBirth() != null) p.setDateOfBirth(updates.getDateOfBirth());
        if (updates.getGender() != null) p.setGender(updates.getGender());
        if (updates.getAddress() != null) p.setAddress(updates.getAddress());
        if (updates.getCity() != null) p.setCity(updates.getCity());
        if (updates.getState() != null) p.setState(updates.getState());
        if (updates.getZipCode() != null) p.setZipCode(updates.getZipCode());
        if (updates.getEmergencyContact() != null) p.setEmergencyContact(updates.getEmergencyContact());
        if (updates.getEmergencyPhone() != null) p.setEmergencyPhone(updates.getEmergencyPhone());
        if (updates.getMedicalHistory() != null) p.setMedicalHistory(updates.getMedicalHistory());
        if (updates.getAllergies() != null) p.setAllergies(updates.getAllergies());
        if (updates.getBloodType() != null) p.setBloodType(updates.getBloodType());
        p.setUpdatedAt(LocalDateTime.now());
        Patient saved = patientRepository.save(p);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        if (!patientRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        patientRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
