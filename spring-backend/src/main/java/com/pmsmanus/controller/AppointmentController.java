package com.pmsmanus.controller;

import com.pmsmanus.entity.Appointment;
import com.pmsmanus.repo.AppointmentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {
    private final AppointmentRepository appointmentRepository;

    public AppointmentController(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    @GetMapping
    public List<Appointment> list() {
        return appointmentRepository.findAll();
    }

    @GetMapping("/date")
    public List<Appointment> byDate(@RequestParam("date") String date) {
        LocalDate d = LocalDate.parse(date);
        return appointmentRepository.findByAppointmentDateOrderByAppointmentTime(d);
    }

    @GetMapping("/today")
    public List<Appointment> today() {
        LocalDate d = LocalDate.now();
        return appointmentRepository.findByAppointmentDateOrderByAppointmentTime(d);
    }

    @GetMapping("/patient/{patientId}")
    public List<Appointment> forPatient(@PathVariable Integer patientId) {
        return appointmentRepository.findByPatientIdOrderByAppointmentDateDesc(patientId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Appointment> getById(@PathVariable Integer id) {
        Optional<Appointment> a = appointmentRepository.findById(id);
        return a.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Appointment> create(@RequestBody Appointment appointment) {
        appointment.setCreatedAt(LocalDateTime.now());
        appointment.setUpdatedAt(LocalDateTime.now());
        Appointment saved = appointmentRepository.save(appointment);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Appointment> updateStatus(@PathVariable Integer id, @RequestBody StatusPayload payload) {
        Optional<Appointment> existing = appointmentRepository.findById(id);
        if (existing.isEmpty()) return ResponseEntity.notFound().build();
        Appointment a = existing.get();
        a.setStatus(payload.getStatus());
        a.setUpdatedAt(LocalDateTime.now());
        Appointment saved = appointmentRepository.save(a);
        return ResponseEntity.ok(saved);
    }

    public static class StatusPayload {
        private String status;
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}
